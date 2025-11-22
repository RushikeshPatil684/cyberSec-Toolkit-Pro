# 🧪 Local Testing Guide - CyberSec Toolkit Pro

Quick guide to test the project locally before deployment.

---

## 📋 Prerequisites

- Python 3.11+ installed
- Node.js 18+ and npm installed
- Backend dependencies installed (`pip install -r requirements.txt`)
- Frontend dependencies installed (`npm install`)

---

## 🚀 Quick Start

### 1. Backend Setup & Start

```powershell
cd backend
venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

**Expected:** Server runs on `http://localhost:5000`

**Verify:** Visit `http://localhost:5000` → Should return:
```json
{"message": "CyberSec Toolkit Pro API running!"}
```

---

### 2. Frontend Setup & Start

```powershell
cd frontend
npm install
npm start
```

**Expected:** Dev server runs on `http://localhost:3000`

**Verify:** Browser opens automatically to `http://localhost:3000`

---

## 🔍 API Smoke Tests (curl)

### Test 1: Hash Generator

```powershell
curl -X POST http://localhost:5000/api/tools/hash -H "Content-Type: application/json" -d "{\"text\":\"test\",\"alg\":\"sha256\"}"
```

**Expected:** JSON response with `alg`, `text_len`, and `hash` fields

---

### Test 2: Reports List

```powershell
curl http://localhost:5000/api/reports
```

**Expected:** JSON array (or `{"total": 0, "items": []}` if no reports)

---

### Test 3: Create Test Report

```powershell
curl -X POST http://localhost:5000/api/reports -H "Content-Type: application/json" -d "{\"title\":\"Test Scan\",\"data\":{\"ip\":\"8.8.8.8\",\"status\":\"ok\"}}"
```

**Expected:** JSON with `id`, `message`, and `created_at`

---

### Test 4: AI Assistant (Fallback)

```powershell
curl -X POST http://localhost:5000/api/ai/assistant -H "Content-Type: application/json" -d "{\"prompt\":\"What is port scanning?\"}"
```

**Expected:** JSON with `answer` and `source: "fallback"` (if no OpenAI key)

---

## 🖥️ Manual UI Tests

### Tools Page (`/tools`)

1. **IP Info**
   - Enter IP: `8.8.8.8`
   - Click "Fetch"
   - ✅ Should show IP geolocation data

2. **WHOIS Lookup**
   - Enter domain: `example.com`
   - Click "Lookup"
   - ✅ Should show domain registration info

3. **DNS Lookup**
   - Enter domain: `google.com`
   - Click "Resolve"
   - ✅ Should show A, MX, NS records

4. **Hash Generator**
   - Select algorithm: `sha256`
   - Enter text: `hello`
   - Click "Generate"
   - ✅ Should show hash digest

5. **CVE Search**
   - Enter query: `openssl`
   - Click "Search"
   - ✅ Should show CVE results list

---

### Reports Page (`/reports`)

1. **View Reports**
   - Navigate to `/reports`
   - ✅ Should list saved reports (or "No reports found")

2. **Select Report**
   - Click "Select for AI" on a report
   - ✅ Report card highlights green
   - ✅ Banner shows selected report

3. **Summarize Report**
   - Select a report
   - Click "📋 Summarize Report"
   - ✅ Chat widget opens
   - ✅ AI summary appears in chat

4. **Delete Report**
   - Click "Delete" on a report
   - Confirm deletion
   - ✅ Toast notification appears
   - ✅ Report removed from list

5. **Export PDF**
   - Click "Download PDF" on a report
   - ✅ PDF file downloads
   - ✅ Toast notification appears

---

### Chat Widget

1. **Open Chat**
   - Click chat button (bottom-right)
   - ✅ Chat window opens with animation

2. **Send Message**
   - Type: "What is port scanning?"
   - Press Enter or click "Send"
   - ✅ Message appears in chat
   - ✅ AI response appears

3. **Context Awareness**
   - Select a report first
   - Open chat
   - Ask: "Summarize this report"
   - ✅ Response includes report context

---

### Toast Notifications

1. **Success Toast**
   - Delete a report
   - ✅ Green success toast appears top-right

2. **Error Toast**
   - Try invalid operation
   - ✅ Red error toast appears

3. **Warning Toast**
   - Click "Summarize" without selecting report
   - ✅ Yellow warning toast appears

---

### Responsive Design

1. **Mobile View**
   - Resize browser to < 768px width
   - ✅ Navbar links hide
   - ✅ Sidebar hidden
   - ✅ Content adapts to mobile layout

2. **Focus States**
   - Tab through buttons/inputs
   - ✅ Green focus outline appears

---

## ✅ Final Checklist

- [ ] Backend runs on port 5000
- [ ] Frontend runs on port 3000
- [ ] All API curl tests pass
- [ ] Tools page: All 5 tools work
- [ ] Reports page: CRUD operations work
- [ ] Chat widget: Opens, sends messages, shows responses
- [ ] Toast notifications: Success/error/warning appear
- [ ] Responsive: Mobile layout works
- [ ] No console errors in browser DevTools
- [ ] No errors in backend terminal

---

## 🐛 Troubleshooting

**Backend won't start:**
- Check if port 5000 is in use
- Verify `venv` is activated
- Check `firebase-key.json` exists (if using Firebase)

**Frontend won't start:**
- Delete `node_modules` and run `npm install` again
- Check Node.js version: `node --version` (should be 18+)

**API calls fail:**
- Verify backend is running
- Check CORS settings in `app.py`
- Verify `REACT_APP_API_BASE` in frontend `.env`

**Chat widget doesn't work:**
- Check browser console for errors
- Verify backend `/api/ai/assistant` endpoint responds

---

## 📝 Notes

- Backend uses Firebase Firestore (optional - app works without it)
- AI assistant uses OpenAI API (optional - fallback mode works without key)
- All sensitive keys should be in `.env` files (not committed to git)

