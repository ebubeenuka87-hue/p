"use client";

import { useState } from "react";

type Complaint = {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  createdAt: string;
};

const statuses: Complaint["status"][] = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];

export function AdminComplaints({ initialComplaints }: { initialComplaints: Complaint[] }) {
  const [complaints, setComplaints] = useState(initialComplaints);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function updateStatus(id: string, status: Complaint["status"]) {
    setError("");
    setSuccess("");
    try {
      const response = await fetch("/api/admin/complaints", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ complaintId: id, status }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Complaint status could not be updated.");
      setComplaints((items) => items.map((item) => item.id === id ? { ...item, status } : item));
      setSuccess("Complaint status updated.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Complaint status could not be updated.");
    }
  }

  return <>
    <h2 style={{ font: "500 27px var(--font-serif)" }}>Customer complaints</h2>
    {error && <p className="form-error" role="alert">{error}</p>}
    {success && <p className="form-success" role="status">{success}</p>}
    {complaints.length ? <div className="complaint-list">{complaints.map((complaint) => <article className="summary-card complaint-card" key={complaint.id}>
      <div className="complaint-heading"><div><h3>{complaint.name}</h3><p><a href={`mailto:${complaint.email}`}>{complaint.email}</a> · <a href={`tel:${complaint.phone}`}>{complaint.phone}</a></p></div><time dateTime={complaint.createdAt}>{new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeStyle: "short" }).format(new Date(complaint.createdAt))}</time></div>
      <p className="complaint-message">{complaint.message}</p>
      <label className="form-field">Status<select className="field" value={complaint.status} onChange={(event) => void updateStatus(complaint.id, event.target.value as Complaint["status"])}>{statuses.map((status) => <option key={status}>{status}</option>)}</select></label>
    </article>)}</div> : <div className="empty-state"><h2>No messages yet</h2><p>Customer contact requests will appear here.</p></div>}
  </>;
}
