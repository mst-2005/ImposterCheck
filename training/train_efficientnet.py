"""
Train EfficientNetB0 on a folder dataset.

Expected layout:
data/raw/
  real/
    image1.jpg
  fake/
    image2.jpg

Output:
models/efficientnetb0_document.keras
"""
from pathlib import Path
import tensorflow as tf

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data" / "raw"
OUT = ROOT / "models" / "efficientnetb0_document.keras"

IMG = (224, 224)
BATCH = 16
EPOCHS = 5

train_ds = tf.keras.utils.image_dataset_from_directory(
    DATA, validation_split=0.2, subset="training", seed=42,
    image_size=IMG, batch_size=BATCH, label_mode="binary"
)
val_ds = tf.keras.utils.image_dataset_from_directory(
    DATA, validation_split=0.2, subset="validation", seed=42,
    image_size=IMG, batch_size=BATCH, label_mode="binary"
)

base = tf.keras.applications.EfficientNetB0(
    include_top=False, weights="imagenet", input_shape=(*IMG,3)
)
base.trainable = False

model = tf.keras.Sequential([
    tf.keras.layers.Input(shape=(*IMG,3)),
    tf.keras.applications.efficientnet.preprocess_input,
    base,
    tf.keras.layers.GlobalAveragePooling2D(),
    tf.keras.layers.Dropout(0.25),
    tf.keras.layers.Dense(1, activation="sigmoid")
])
model.compile(optimizer="adam", loss="binary_crossentropy", metrics=["accuracy", tf.keras.metrics.AUC()])
model.fit(train_ds, validation_data=val_ds, epochs=EPOCHS)
OUT.parent.mkdir(exist_ok=True)
model.save(OUT)
print(f"Saved {OUT}")
