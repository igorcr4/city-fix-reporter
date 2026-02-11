import type {
  LoginRequest,
  RegisterRequest,
  Report,
  CreateReportRequest,
  UpdateReportRequest,
  User,
} from "@/types";

// TODO: Schimbă BASE_URL cu URL-ul real al backend-ului Spring Boot
const BASE_URL = "http://localhost:8080/api";

function getAuthHeaders(): HeadersInit {
  const user = localStorage.getItem("fixcity_user");
  if (user) {
    const parsed = JSON.parse(user) as User;
    return {
      Authorization: `Bearer ${parsed.token}`,
    };
  }
  return {};
}

// ==================== AUTH ====================

export async function login(data: LoginRequest): Promise<User> {
  // TODO: Apelează backend-ul real de login
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Autentificare eșuată");
  return res.json();
}

export async function register(data: RegisterRequest): Promise<User> {
  // TODO: Apelează backend-ul real de register
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Înregistrare eșuată");
  return res.json();
}

// ==================== REPORTS ====================

export async function getAllReports(): Promise<Report[]> {
  // TODO: Apelează GET /api/reports
  const res = await fetch(`${BASE_URL}/reports`, {
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error("Nu s-au putut încărca rapoartele");
  return res.json();
}

export async function getMyReports(): Promise<Report[]> {
  // TODO: Apelează GET /api/reports/mine
  const res = await fetch(`${BASE_URL}/reports/mine`, {
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error("Nu s-au putut încărca rapoartele tale");
  return res.json();
}

export async function getReportById(id: number): Promise<Report> {
  // TODO: Apelează GET /api/reports/:id
  const res = await fetch(`${BASE_URL}/reports/${id}`, {
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error("Raportul nu a fost găsit");
  return res.json();
}

export async function createReport(data: CreateReportRequest): Promise<Report> {
  // TODO: Apelează POST /api/reports (multipart/form-data pt imagine)
  const formData = new FormData();
  formData.append("title", data.title);
  formData.append("description", data.description);
  formData.append("category", data.category);
  if (data.image) {
    formData.append("image", data.image);
  }

  const res = await fetch(`${BASE_URL}/reports`, {
    method: "POST",
    headers: { ...getAuthHeaders() },
    body: formData,
  });
  if (!res.ok) throw new Error("Raportul nu a putut fi creat");
  return res.json();
}

export async function updateReport(
  id: number,
  data: UpdateReportRequest
): Promise<Report> {
  // TODO: Apelează PUT /api/reports/:id
  const formData = new FormData();
  formData.append("title", data.title);
  formData.append("description", data.description);
  formData.append("category", data.category);
  if (data.image) {
    formData.append("image", data.image);
  }

  const res = await fetch(`${BASE_URL}/reports/${id}`, {
    method: "PUT",
    headers: { ...getAuthHeaders() },
    body: formData,
  });
  if (!res.ok) throw new Error("Raportul nu a putut fi actualizat");
  return res.json();
}

export async function deleteReport(id: number): Promise<void> {
  // TODO: Apelează DELETE /api/reports/:id
  const res = await fetch(`${BASE_URL}/reports/${id}`, {
    method: "DELETE",
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error("Raportul nu a putut fi șters");
}
