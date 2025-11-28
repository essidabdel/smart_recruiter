# backend/ai_engine/train_minilm.py

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from pathlib import Path

from datasets import Dataset
from sentence_transformers import SentenceTransformer, InputExample, losses
from torch.utils.data import DataLoader

# ====== CONFIG ======
BASE_DIR = Path(__file__).resolve().parent
DATA_PATH = BASE_DIR / "data" / "resume_dataset_1200.csv"  
OUTPUT_DIR = BASE_DIR / "models" / "hr_matching_minilm"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

CV_COL = "resume_text"
JOB_COL = "job_text"
LABEL_COL = "label"

MODEL_NAME = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
BATCH_SIZE = 16
EPOCHS = 3
# =====================


def build_resume_text(row):
    parts = []

    if pd.notna(row.get("Name")):
        parts.append(f"Nom: {row['Name']}")
    if pd.notna(row.get("Education_Level")):
        parts.append(f"Niveau d'étude: {row['Education_Level']}")
    if pd.notna(row.get("Field_of_Study")):
        parts.append(f"Domaine: {row['Field_of_Study']}")
    if pd.notna(row.get("Degrees")):
        parts.append(f"Diplôme: {row['Degrees']}")
    if pd.notna(row.get("Experience_Years")):
        parts.append(f"Années d'expérience: {row['Experience_Years']}")
    if pd.notna(row.get("Current_Job_Title")):
        parts.append(f"Poste actuel: {row['Current_Job_Title']}")
    if pd.notna(row.get("Previous_Job_Titles")):
        parts.append(f"Postes précédents: {row['Previous_Job_Titles']}")
    if pd.notna(row.get("Skills")):
        parts.append(f"Compétences: {row['Skills']}")
    if pd.notna(row.get("Certifications")):
        parts.append(f"Certifications: {row['Certifications']}")

    return " | ".join(parts)


def make_pairs(df: pd.DataFrame) -> pd.DataFrame:
    rng = np.random.default_rng(42)

    positives = []
    negatives = []

    resume_texts = df[CV_COL].tolist()
    job_texts = df[JOB_COL].tolist()
    n = len(df)

    for i in range(n):
        cv = resume_texts[i]
        job_pos = job_texts[i]

        positives.append(
            {CV_COL: cv, JOB_COL: job_pos, LABEL_COL: 1.0}
        )

        j = i
        while j == i:
            j = rng.integers(0, n)
        job_neg = job_texts[j]

        negatives.append(
            {CV_COL: cv, JOB_COL: job_neg, LABEL_COL: 0.0}
        )

    return pd.DataFrame(positives + negatives)


def ds_to_input_examples(hf_ds: Dataset):
    examples = []
    for row in hf_ds:
        cv = row[CV_COL]
        job = row[JOB_COL]
        label = float(row[LABEL_COL])
        examples.append(InputExample(texts=[cv, job], label=label))
    return examples


def main():
    print("🔹 Chargement du CSV :", DATA_PATH)
    df = pd.read_csv(DATA_PATH)

    # Construire les textes CV + job
    df[CV_COL] = df.apply(build_resume_text, axis=1)
    df[JOB_COL] = df["Target_Job_Description"]

    # Paires pos/neg
    pairs_df = make_pairs(df)
    print("Taille du dataset de paires :", len(pairs_df))

    # Splits train/val/test
    train_df, test_df = train_test_split(
        pairs_df, test_size=0.2, random_state=42, stratify=pairs_df[LABEL_COL]
    )
    train_df, val_df = train_test_split(
        train_df, test_size=0.1, random_state=42, stratify=train_df[LABEL_COL]
    )

    print("Split -> train:", len(train_df), "val:", len(val_df), "test:", len(test_df))

    train_ds = Dataset.from_pandas(train_df.reset_index(drop=True))
    val_ds = Dataset.from_pandas(val_df.reset_index(drop=True))

    train_examples = ds_to_input_examples(train_ds)
    val_examples = ds_to_input_examples(val_ds)

    print("Nb exemples train:", len(train_examples), "val:", len(val_examples))

    # Chargement du modèle de base
    print("🔹 Chargement du modèle :", MODEL_NAME)
    model = SentenceTransformer(MODEL_NAME)

    train_dataloader = DataLoader(train_examples, shuffle=True, batch_size=BATCH_SIZE)
    train_loss = losses.CosineSimilarityLoss(model)

    warmup_steps = int(0.1 * len(train_dataloader) * EPOCHS)
    print("Warmup steps :", warmup_steps)

    print("🔹 Début de l'entraînement...")
    model.fit(
        train_objectives=[(train_dataloader, train_loss)],
        epochs=EPOCHS,
        warmup_steps=warmup_steps,
        show_progress_bar=True,
    )

    print("🔹 Sauvegarde du modèle dans :", OUTPUT_DIR)
    model.save(str(OUTPUT_DIR))

    print("✅ Entraînement terminé.")


if __name__ == "__main__":
    main()
