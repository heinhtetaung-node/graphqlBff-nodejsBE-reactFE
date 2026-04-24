import { useState } from "react";
import { useQuery } from "@apollo/client";
import { Navigate, Link } from "react-router-dom";
import {
  GET_ME,
  MY_APPLICATIONS,
  MY_JOBS,
  APPLICATIONS_BY_JOB,
} from "../graphql/queries";
import { useAuth } from "../context/AuthContext";

function JobApplications({ jobId }) {
  const { data, loading } = useQuery(APPLICATIONS_BY_JOB, {
    variables: { jobId, page: 1, limit: 50 },
  });

  if (loading)
    return (
      <div style={{ padding: "8px 0", color: "#666" }}>
        Loading applications...
      </div>
    );

  const apps = data?.applicationsByJob?.applications || [];
  if (apps.length === 0)
    return (
      <div style={{ padding: "8px 0", color: "#666" }}>
        No applications yet.
      </div>
    );

  return (
    <div style={{ marginTop: 8 }}>
      {apps.map((app) => (
        <div
          key={app.id}
          style={{
            padding: "8px 12px",
            background: "#f9f9f9",
            borderRadius: 4,
            marginBottom: 4,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <span style={{ color: "#555" }}>
              Applicant ID: {app.userId?.slice(0, 8)}...
            </span>
            {app.coverLetter && (
              <p style={{ margin: "4px 0 0", fontSize: 13, color: "#777" }}>
                {app.coverLetter.slice(0, 100)}
                {app.coverLetter.length > 100 ? "..." : ""}
              </p>
            )}
            {app.resumeUrl && (
              <a
                href={app.resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-block",
                  marginTop: 4,
                  fontSize: 13,
                  color: "#2563eb",
                }}
              >
                📄 Download CV
              </a>
            )}
          </div>
          <span
            className={`badge ${app.status === "PENDING" ? "badge-yellow" : app.status === "ACCEPTED" ? "badge-green" : "badge-red"}`}
          >
            {app.status}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const { user, isAuthenticated } = useAuth();
  const [expandedJob, setExpandedJob] = useState(null);
  const { data: meData, loading: meLoading } = useQuery(GET_ME, {
    skip: !isAuthenticated,
  });
  const { data: appsData } = useQuery(MY_APPLICATIONS, {
    variables: { page: 1, limit: 10 },
    skip: !isAuthenticated || user?.role !== "JOB_HUNTER",
  });
  const { data: myJobsData } = useQuery(MY_JOBS, {
    variables: { page: 1, limit: 20 },
    skip: !isAuthenticated || user?.role !== "TALENT_HUNTER",
  });

  if (!isAuthenticated) return <Navigate to="/login" />;
  if (meLoading) return <div className="loading">Loading...</div>;

  const me = meData?.me;
  const sub = me?.subscription;

  return (
    <div style={{ maxWidth: 800, margin: "32px auto" }}>
      <div className="page-header">
        <h1>Dashboard</h1>
      </div>

      <div className="card">
        <h3>Profile</h3>
        <p>
          <strong>Name:</strong> {me?.name}
        </p>
        <p>
          <strong>Email:</strong> {me?.email}
        </p>
        <p>
          <strong>Role:</strong>{" "}
          {me?.role === "TALENT_HUNTER" ? "Talent Hunter" : "Job Hunter"}
        </p>
        {me?.bio && (
          <p>
            <strong>Bio:</strong> {me.bio}
          </p>
        )}
        {me?.skills?.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <strong>Skills: </strong>
            {me.skills.map((s) => (
              <span
                key={s}
                className="badge badge-green"
                style={{ marginRight: 4 }}
              >
                {s}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h3>Subscription</h3>
        {sub ? (
          <>
            <p>
              <strong>Plan:</strong> {sub.plan.replace(/_/g, " ")}
            </p>
            <p>
              <strong>Price:</strong>{" "}
              {sub.price > 0 ? `$${sub.price}/month` : "Free"}
            </p>
            <p>
              <strong>Status:</strong>{" "}
              <span
                className={`badge ${sub.status === "ACTIVE" ? "badge-green" : "badge-red"}`}
              >
                {sub.status}
              </span>
            </p>
          </>
        ) : (
          <p>
            No active subscription. <Link to="/pricing">Choose a plan</Link>
          </p>
        )}
        <div style={{ marginTop: 12 }}>
          <Link to="/pricing" className="btn btn-primary">
            Manage Plan
          </Link>
        </div>
      </div>

      {user?.role === "TALENT_HUNTER" && (
        <div className="card">
          <h3>Quick Actions</h3>
          <Link
            to="/jobs/new"
            className="btn btn-primary"
            style={{ marginRight: 8 }}
          >
            Post a Job
          </Link>
          <Link to="/companies" className="btn btn-secondary">
            View Companies
          </Link>
        </div>
      )}

      {user?.role === "TALENT_HUNTER" && (
        <div className="card">
          <h3>My Posted Jobs ({myJobsData?.myJobs?.total || 0})</h3>
          {!myJobsData?.myJobs?.jobs?.length ? (
            <p>
              You haven't posted any jobs yet.{" "}
              <Link to="/jobs/new">Post your first job</Link>
            </p>
          ) : (
            myJobsData.myJobs.jobs.map((job) => (
              <div
                key={job.id}
                style={{ padding: "12px 0", borderBottom: "1px solid #eee" }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <Link
                      to={`/jobs/${job.id}`}
                      style={{
                        fontWeight: 600,
                        color: "#2563eb",
                        textDecoration: "none",
                      }}
                    >
                      {job.title}
                    </Link>
                    <div style={{ fontSize: 13, color: "#666", marginTop: 2 }}>
                      {job.location && <span>{job.location}</span>}
                      {job.jobType && (
                        <span style={{ marginLeft: 8 }}>
                          &middot; {job.jobType}
                        </span>
                      )}
                      {job.salaryRange && (
                        <span style={{ marginLeft: 8 }}>
                          &middot; {job.salaryRange}
                        </span>
                      )}
                    </div>
                  </div>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <span
                      className={`badge ${job.isActive ? "badge-green" : "badge-red"}`}
                    >
                      {job.isActive ? "Active" : "Inactive"}
                    </span>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: "4px 12px", fontSize: 13 }}
                      onClick={() =>
                        setExpandedJob(expandedJob === job.id ? null : job.id)
                      }
                    >
                      {expandedJob === job.id ? "Hide" : "View"} Applications
                    </button>
                  </div>
                </div>
                {expandedJob === job.id && <JobApplications jobId={job.id} />}
              </div>
            ))
          )}
        </div>
      )}

      {user?.role === "JOB_HUNTER" && appsData?.myApplications && (
        <div className="card">
          <h3>My Applications ({appsData.myApplications.total})</h3>
          {appsData.myApplications.applications.length === 0 ? (
            <p>
              No applications yet. <Link to="/jobs">Browse jobs</Link>
            </p>
          ) : (
            appsData.myApplications.applications.map((app) => (
              <div
                key={app.id}
                style={{ padding: "12px 0", borderBottom: "1px solid #eee" }}
              >
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <div>
                    <strong>{app.job?.title}</strong>
                    <span style={{ color: "#666", marginLeft: 8 }}>
                      {app.job?.company?.name}
                    </span>
                  </div>
                  <span
                    className={`badge ${app.status === "PENDING" ? "badge-yellow" : app.status === "ACCEPTED" ? "badge-green" : "badge-red"}`}
                  >
                    {app.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
