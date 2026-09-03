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
    image_size=IMG, batch_size=BATCH, label_mode="binary",
    class_names=["real", "fake"]
)
val_ds = tf.keras.utils.image_dataset_from_directory(
    DATA, validation_split=0.2, subset="validation", seed=42,
    image_size=IMG, batch_size=BATCH, label_mode="binary",
    class_names=["real", "fake"]
)

base = tf.keras.applications.EfficientNetB0(
    include_top=False, weights=None, input_shape=(224, 224, 3)
)

model = tf.keras.Sequential([
    tf.keras.layers.Input(shape=(224, 224, 3)),
    tf.keras.layers.Rescaling(1./255),
    base,
    tf.keras.layers.GlobalAveragePooling2D(),
    tf.keras.layers.Dropout(0.3),
    tf.keras.layers.Dense(64, activation="relu"),
    tf.keras.layers.Dense(1, activation="sigmoid")
])
model.compile(optimizer=tf.keras.optimizers.Adam(learning_rate=1e-3),
              loss="binary_crossentropy",
              metrics=["accuracy", tf.keras.metrics.AUC(name="auc")])
model.fit(train_ds, validation_data=val_ds, epochs=EPOCHS, verbose=1)
OUT.parent.mkdir(exist_ok=True)
model.save(OUT)
print(f"Saved {OUT}")
