# End-to-End Architecture & Workflow Diagrams

This document contains technically accurate, code-based Mermaid diagrams illustrating the complete architecture and specific workflows of the **AI Rural Healthcare System**. 

These diagrams map exactly to your project's source code implementation and are perfect for a senior technical interview presentation.

## 1. High-Level End-to-End Architecture
This diagram shows the complete structural flow from the React frontend, through the network layer, into the Express backend, and down to MongoDB.

```mermaid
graph TD
    classDef frontend fill:#3b82f6,stroke:#1d4ed8,color:white;
    classDef backend fill:#10b981,stroke:#047857,color:white;
    classDef db fill:#f59e0b,stroke:#b45309,color:white;
    classDef external fill:#8b5cf6,stroke:#6d28d9,color:white;

    subgraph Frontend [Client Layer: React 19 SPA Vite + Tailwind]
        React[React Router DOM / Components]:::frontend
        AuthCtx[AuthContext.jsx JWT in localStorage]:::frontend
        Axios[lib/axios.js interceptor attaches Bearer token]:::frontend
        IDB[(idb IndexedDB Offline Storage)]:::frontend
        PeerJS[PeerJS WebRTC Client]:::frontend
        SocketClient[socket.io-client]:::frontend
        
        React --> AuthCtx
        React --> Axios
        React --> IDB
        React --> PeerJS
        React --> SocketClient
    end

    subgraph Backend [Server Layer: Node.js & Express 5]
        Router[Express Router routes/*]:::backend
        AuthMW[auth.js Middleware: jwt.verify]:::backend
        RoleMW[role.js Middleware: requireRole]:::backend
        Controllers[Controllers controllers/*]:::backend
        Mongoose[Mongoose v9 ODM]:::backend
        SocketServer[socket.js Socket.IO Server]:::backend
        Cron[cron/reminderCron.js Node Cron]:::backend
        PDF[PDFKit]:::backend
        WebPush[web-push]:::backend

        Router --> AuthMW
        AuthMW --> RoleMW
        RoleMW --> Controllers
        Controllers --> Mongoose
        Controllers --> PDF
    end
    
    subgraph Database [Data Layer: MongoDB]
        Users[(Users)]:::db
        AISessions[(AISessions)]:::db
        Consultations[(Consultations)]:::db
        QueueEntries[(QueueEntries)]:::db
        Prescriptions[(Prescriptions)]:::db
        Symptoms[(Symptoms)]:::db
        Reminders[(Reminders)]:::db
    end

    subgraph External [External Services]
        GeminiAPI((Google Gemini API)):::external
        PushService((Browser Push Service)):::external
    end
    
    %% High-level connections
    Axios -- REST HTTP GET/POST/PUT/DELETE --> Router
    Mongoose -- BSON / TCP Connection --> Users
    Mongoose --> AISessions
    Mongoose --> Consultations
    Mongoose --> QueueEntries
    Mongoose --> Prescriptions
    Mongoose --> Symptoms
    Mongoose --> Reminders
```

---

## 2. AI Triage Flow & Safety Boundary
This workflow illustrates how user input is sent to Gemini, how the JSON response is intercepted, and how it is mapped against the local Symptoms database to prevent hallucinations and ensure safe medical advice.

```mermaid
sequenceDiagram
    participant Patient as React Frontend (AIAssistant.jsx)
    participant Axios as lib/axios.js
    participant Router as Express (aiRoutes.js)
    participant Auth as Middleware (auth.js)
    participant Ctrl as aiController.chatWithAI
    participant Gemini as Gemini API (@google/generative-ai)
    participant DB as MongoDB (Symptoms / AISession)

    Patient->>Axios: POST /api/ai/chat { message }
    Axios->>Axios: Intercept: Attach JWT Bearer Token
    Axios->>Router: HTTP POST Request
    Router->>Auth: Pass to protect()
    Auth->>Auth: jwt.verify(token) -> req.user
    Auth->>Ctrl: Pass to Controller
    
    Ctrl->>DB: Fetch/Create AISession
    Ctrl->>Gemini: geminiService.chat(history)
    Note over Gemini,Ctrl: Prompt forces JSON output
    Gemini-->>Ctrl: Returns JSON { summary, suggestedPriority }
    
    Ctrl->>Ctrl: tryParseSummary()
    
    alt suggestedPriority is "high" or "critical"
        Ctrl->>Ctrl: Override AI output: "URGENT WARNING: Go to hospital."
    else priority is "routine"
        Ctrl->>DB: Query Symptoms matching AI summary
        DB-->>Ctrl: Returns matched generalGuidance
        Ctrl->>Ctrl: Override AI output with DB pre-approved text
    end
    
    Ctrl->>DB: Save updated AISession
    Ctrl-->>Patient: HTTP 200 JSON { reply: safeText, priority }
```

---

## 3. Doctor Handoff & Real-time Queue
This details what happens when a patient is flagged for consultation and transferred to a doctor.

```mermaid
sequenceDiagram
    participant Patient as Patient Frontend
    participant Ctrl as aiController.handoffSession
    participant DB as MongoDB
    participant Socket as socket.js (Socket.IO)
    participant Doctor as Doctor Dashboard

    Patient->>Ctrl: POST /api/ai/handoff/:sessionId
    Ctrl->>DB: Read AISession
    Ctrl->>DB: Create Consultation (maps aiSessionId)
    Ctrl->>DB: Create QueueEntry (status: 'waiting')
    Ctrl->>DB: Update User currentPriority
    
    Ctrl->>Socket: io.to('queue_doctorId').emit('queue_updated')
    Socket-->>Doctor: Push real-time event
    Doctor->>Doctor: React re-renders queue list instantly
```

---

## 4. Telemedicine (WebRTC & Socket.io Signaling)
The exact flow of negotiating a P2P video call using Socket.io to trade IDs, and PeerJS to establish the WebRTC connection.

```mermaid
sequenceDiagram
    participant Patient as Patient (TelemedicineRoom.jsx)
    participant SocketServer as Node.js Socket.IO Server
    participant Doctor as Doctor (TelemedicineRoom.jsx)
    participant STUN as STUN/TURN Servers

    Note over Patient,Doctor: Both join Socket.IO room "consultation_xyz"
    
    Doctor->>SocketServer: emit('join_room', roomId, peerId)
    SocketServer-->>Patient: broadcast('user_connected', peerId)
    
    Patient->>STUN: Request Public IP/ICE Candidates
    STUN-->>Patient: Return ICE Candidates
    
    Patient->>Patient: PeerJS peer.call(doctorPeerId, localStream)
    Note over Patient,Doctor: Signaling happens under the hood via Socket.IO
    
    Doctor->>Doctor: peer.on('call') -> call.answer(localStream)
    
    Patient<<=>>Doctor: WebRTC P2P UDP Audio/Video Stream established!
```

---

## 5. E-Prescription & PDF Generation Flow
How prescriptions are securely saved in the database and converted into downloadable PDFs.

```mermaid
graph LR
    Doc[Doctor UI] -- Submit Form --> Axios[Axios POST /api/prescriptions]
    Axios --> Auth[auth.js & role.js 'doctor']
    Auth --> Ctrl[prescriptionController.createPrescription]
    Ctrl -- 1. Save Data --> DB[(MongoDB Prescriptions)]
    Ctrl -- 2. Generate --> PDFKit[PDFKit Library]
    PDFKit -- 3. Write Stream --> FS[(/uploads directory)]
    Ctrl -- 4. Return URL --> Doc
```

---

## 6. ASHA Worker Offline Sync Flow
How IndexedDB allows ASHA workers to register patients in areas without cellular service.

```mermaid
graph TD
    ASHA[ASHA Dashboard] -- 1. Fills Registration Form --> Submit[Submit Event]
    Submit -- 2. navigator.onLine == false --> IDB[(idb IndexedDB)]
    IDB -- Form saved locally --> ASHA
    
    Window[Browser Event Listener] -- 3. 'online' event triggered --> SyncLogic[Background Sync Function]
    SyncLogic -- 4. Read pending forms --> IDB
    SyncLogic -- 5. Iterate & POST --> Axios[Axios POST /api/asha/...]
    Axios -- 6. Sync to Server --> Backend[Express Server]
    Backend -- 7. Save --> DB[(MongoDB)]
    Backend -- 8. Return 200 OK --> SyncLogic
    SyncLogic -- 9. Remove synced form --> IDB
```

---

## 7. Medication Reminders & Push Notifications
The background architecture for automated patient notifications.

```mermaid
graph TD
    Cron[cron/reminderCron.js node-cron] -- 1. Runs every minute --> DB[(MongoDB Reminders)]
    DB -- 2. Returns reminders due now --> Cron
    Cron -- 3. Fetch Push Subscription --> Users[(MongoDB Users)]
    Users -- 4. Returns pushSubscription object --> Cron
    Cron -- 5. Loop & Send --> WebPush[web-push Library]
    WebPush -- 6. HTTP POST --> VAPID((Google/Mozilla Push Service))
    VAPID -- 7. Deliver Notification --> ServiceWorker[Patient Browser Service Worker]
    ServiceWorker -- 8. Show OS Notification --> Patient[Patient Device]
```
