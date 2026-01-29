 Run the Backend (Python ML API)
Major-Project-master/flood_ml_project_complete/backend

### Step 1: Open a terminal and go to backend

cd flood_ml_project_complete/backend


### Step 2: (Optional but recommended) Create a virtual environment
python -m venv venv

Activate it:
venv\Scripts\activate

* **Mac/Linux**
source venv/bin/activate

### Step 3: Install required packages

```bash
pip install fastapi uvicorn pandas scikit-learn xgboost
```

### Step 4: (Only once) Generate & train model

```bash
python generate_india_waterlogging_data.py
python train_waterlogging_model.py
```

### Step 5: Start the backend server 🚀

```bash
uvicorn main:app --reload --port 8000
```

✅ Backend will run at:

```
http://localhost:8000
```

Test it:

```
POST http://localhost:8000/predict
```

---

## 2️⃣ Run the Frontend (React App)


```bash
Major-Project-master/flood_ml_project_complete/frontend
```

### Step 1: Open a NEW terminal

(keep backend running)

```bash
cd flood_ml_project_complete/frontend
```

### Step 2: Install dependencies

```bash
npm install
```

### Step 3: Start React app

```bash
npm start
```

✅ Frontend will run at:

```
http://localhost:3000
```

---

⚠️ Backend **must be running first**, or the frontend API call will fail.

---

## 4️⃣ Correct Run Order (Important)

✅ **Always follow this order:**

1. Start **Backend** (`uvicorn main:app`)
2. Start **Frontend** (`npm start`)
3. Open browser → `http://localhost:3000`

-
