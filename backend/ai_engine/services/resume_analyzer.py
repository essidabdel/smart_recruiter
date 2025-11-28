# ai_engine/services/resume_analyzer.py
import re
from pathlib import Path

import PyPDF2
from PyPDF2.errors import PdfReadError
from sentence_transformers import SentenceTransformer, util

# === chemins ===
BASE_DIR = Path(__file__).resolve().parent.parent.parent
FINETUNED_DIR = BASE_DIR / "ai_engine" / "models" / "hr_matching_minilm"

# === Chargement MiniLM fine-tuné ou modèle de base ===
if FINETUNED_DIR.exists():
    sbert_model = SentenceTransformer(str(FINETUNED_DIR))
else:
    sbert_model = SentenceTransformer(
        "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
    )


def extract_text_from_pdf(file_path: str) -> str:
    """
    Essaie d'extraire le texte comme un vrai PDF.
    Si le fichier n'est pas vraiment un PDF (cas de test), on fallback sur lecture brute.
    """
    try:
        text = ""
        with open(file_path, "rb") as f:
            reader = PyPDF2.PdfReader(f)
            for page in reader.pages:
                page_text = page.extract_text() or ""
                text += page_text + "\n"
        return text.strip()
    except PdfReadError:
        # Fichier pas vraiment PDF
        with open(file_path, "rb") as f:
            data = f.read()
        return data.decode("utf-8", errors="ignore").strip()
    except Exception:
        return ""


# ===== Parsing des sections CV =====

EXP_KEYS = [
    "EXPERIENCE",
    "EXPÉRIENCE",
    "EXPERIENCE PROFESSIONNELLE",
    "EXPÉRIENCE PROFESSIONNELLE",
    "PROFESSIONNELLE",
    "WORK EXPERIENCE",
]
EDU_KEYS = [
    "FORMATION",
    "EDUCATION",
    "ÉDUCATION",
    "ETUDES",
    "ÉTUDES",
    "DIPLÔME",
    "DIPLOME",
]
SKILLS_KEYS = [
    "COMPETENCE",
    "COMPÉTENCE",
    "COMPETENCES",
    "COMPÉTENCES",
    "SKILLS",
    "TECHNICAL SKILLS",
]


def _normalize_lines(text: str):
    lines = [l.strip() for l in text.splitlines()]
    lines = [l for l in lines if l]
    upper = [l.upper() for l in lines]
    return lines, upper


def _find_section_indices(upper_lines):
    indices = {"skills": None, "experiences": None, "education": None}

    for i, u in enumerate(upper_lines):
        if indices["skills"] is None and any(k in u for k in SKILLS_KEYS):
            indices["skills"] = i
        if indices["experiences"] is None and any(k in u for k in EXP_KEYS):
            indices["experiences"] = i
        if indices["education"] is None and any(k in u for k in EDU_KEYS):
            indices["education"] = i

    return indices


def _compute_section_end(start_idx, indices_dict):
    """
    Donne l'index de fin pour une section :
    => premier header qui vient APRÈS start_idx.
    """
    if start_idx is None:
        return None
    candidates = [
        pos
        for key, pos in indices_dict.items()
        if pos is not None and pos > start_idx
    ]
    return min(candidates) if candidates else None


def _extract_block(lines, start_idx, end_idx):
    """
    Récupère le bloc de texte entre un header et le header suivant,
    puis essaie de le découper en entrées (expériences ou formations).
    """
    if start_idx is None:
        return []
    if end_idx is None:
        sub = lines[start_idx + 1 :]
    else:
        sub = lines[start_idx + 1 : end_idx]

    paragraph = " ".join(sub)
    paragraph = re.sub(r"\s+", " ", paragraph).strip()
    if not paragraph:
        return []

    # 1) découpe principale sur des motifs de dates de type "2021 - 2024"
    chunks = re.split(r"(?=\b(19|20)\d{2}\s*[-–])", paragraph)
    chunks = [c.strip(" ,.;") for c in chunks if c.strip()]

    # 2) si on a encore un seul gros bloc, on tente une découpe sur les rôles
    if len(chunks) == 1:
        role_split = re.split(
            r"(?=\b(Développeur|DEVELOPPEUR|Developer|ENGINEER|Ingénieur|INGÉNIEUR|STAGE)\b)",
            chunks[0],
        )
        role_split = [c.strip(" ,.;") for c in role_split if c.strip()]
        if len(role_split) > 1:
            chunks = role_split

    return chunks


def dummy_extract_structured_info(text: str) -> dict:
    if not text:
        return {"skills": [], "experiences": [], "education": []}

    # --- lignes + headers ---
    lines, upper = _normalize_lines(text)
    idx = _find_section_indices(upper)

    section_indices = {
        "skills": idx["skills"],
        "experiences": idx["experiences"],
        "education": idx["education"],
    }

    # === SKILLS ===
    skills_block = []
    if idx["skills"] is not None:
        end_skills = _compute_section_end(idx["skills"], section_indices)
        skills_block = _extract_block(lines, idx["skills"], end_skills)

    skills_text = (" ".join(skills_block) + " " + text).lower()
    skill_candidates = [
        "python",
        "django",
        "flask",
        "react",
        "vue",
        "angular",
        "sql",
        "postgresql",
        "mysql",
        "nlp",
        "machine learning",
        "deep learning",
        "docker",
        "kubernetes",
        "git",
    ]
    skills = sorted({s for s in skill_candidates if s in skills_text})

    # === EXPERIENCES ===
    experiences_raw = []
    if idx["experiences"] is not None:
        end_exp = _compute_section_end(idx["experiences"], section_indices)
        experiences_raw = _extract_block(lines, idx["experiences"], end_exp)

    # === EDUCATION ===
    education_raw = []
    if idx["education"] is not None:
        end_edu = _compute_section_end(idx["education"], section_indices)
        education_raw = _extract_block(lines, idx["education"], end_edu)

    def clean_entry(e: str) -> str:
        s = e.replace("\r", " ")
        s = re.sub(r"\s{2,}", " ", s)
        s = s.strip()
        s = re.sub(
            r"^\s*(competences?|compétences?|contact|texte brut du cv|cv analysé)[:\s-]*",
            "",
            s,
            flags=re.IGNORECASE,
        )
        s = s.strip(" -–—:;,.\t")
        return s

    def tidy_list(lst):
        out = []
        seen = set()
        for item in lst:
            it = clean_entry(item)

            # trop court ou pas de lettres → on jette (ex: "20")
            if not it or len(it) < 10:
                continue
            if not re.search(r"[A-Za-zÀ-ÿ]", it):
                continue

            # tronquer les pavés énormes
            if len(it) > 400:
                it = it[:400].rsplit(" ", 1)[0] + "..."

            if it not in seen:
                out.append(it)
                seen.add(it)
        return out

    experiences = tidy_list(experiences_raw)
    education = tidy_list(education_raw)

    # Re-classement : certaines lignes sont plutôt "formation" ou plutôt "expérience"
    job_pattern = re.compile(
        r"(développeur|developer|engineer|ingénieur|stage|intern|alternance|fullstack|data|cyber|chef de projet|manager)",
        re.IGNORECASE,
    )
    edu_pattern = re.compile(
        r"(licen|mast[eè]r|dipl[oô]me|école|ecole|univ|bachelor|mba|phd|bac\s*\+|\bBUT\b|\bDUT\b)",
        re.IGNORECASE,
    )

    # ce qui ressemble à de la formation ne reste pas dans experiences
    moved_to_edu = []
    kept_exp = []
    for e in experiences:
        if edu_pattern.search(e) and not job_pattern.search(e):
            moved_to_edu.append(e)
        else:
            kept_exp.append(e)
    experiences = kept_exp
    education += moved_to_edu

    # ce qui ressemble à un poste ne reste pas dans education
    moved_to_exp = []
    kept_edu = []
    for e in education:
        if job_pattern.search(e) and not edu_pattern.search(e):
            moved_to_exp.append(e)
        else:
            kept_edu.append(e)
    education = kept_edu
    experiences += moved_to_exp

    # dédoublonnage final
    def dedupe(lst):
        out, seen = [], set()
        for x in lst:
            if x not in seen:
                out.append(x)
                seen.add(x)
        return out

    experiences = dedupe(experiences)
    education = dedupe(education)

    # fallback si pas de formation détectée
    if not education:
        edu_candidates = []
        for line in lines:
            if edu_pattern.search(line):
                s = clean_entry(line)
                if len(s) > 10:
                    edu_candidates.append(s)
        education = dedupe(edu_candidates)[:3]

    return {
        "skills": skills,
        "experiences": experiences,
        "education": education,
    }


def compute_similarity_score(cv_text: str, job_description: str) -> float:
    """
    Score de similarité CV <-> job avec MiniLM (0-1).
    Utilise ton modèle fine-tuné si présent.
    """
    embeddings = sbert_model.encode(
        [cv_text, job_description],
        convert_to_tensor=True,
    )
    cv_emb, job_emb = embeddings[0], embeddings[1]
    sim = util.cos_sim(cv_emb, job_emb).item()
    return float(sim)
