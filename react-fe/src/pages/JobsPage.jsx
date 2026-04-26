import { useState } from "react";
import { useQuery } from "@apollo/client";
import { Link, useSearchParams } from "react-router-dom";
import { GET_JOBS, GET_COMPANIES } from "../graphql/queries";
import { useAuth } from "../context/AuthContext";

export default function JobsPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [companyId, setCompanyId] = useState(
    searchParams.get("companyId") || "",
  );
  const { data, loading, error } = useQuery(GET_JOBS, {
    variables: { page: 1, limit: 20, companyId: companyId || undefined },
  });
  const { data: companiesData } = useQuery(GET_COMPANIES, {
    variables: { page: 1, limit: 100 },
  });

  const handleCompanyChange = (e) => {
    const val = e.target.value;
    setCompanyId(val);
    if (val) setSearchParams({ companyId: val });
    else setSearchParams({});
  };

  if (loading) return <div className="loading">Loading jobs...</div>;
  if (error) return <div className="error">Error: {error.message}</div>;

  const { jobs, total } = data.jobs;

  return (
    <div>
      <div
        className="page-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h1>Jobs ({total})</h1>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <select
            value={companyId}
            onChange={handleCompanyChange}
            style={{
              padding: "6px 12px",
              borderRadius: 4,
              border: "1px solid #ccc",
            }}
          >
            <option value="">All Companies</option>
            {companiesData?.companies?.companies?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {user?.role === "TALENT_HUNTER" && (
            <Link to="/jobs/new" className="btn btn-primary">
              Post a Job
            </Link>
          )}
        </div>
      </div>
      <div className="grid grid-2">
        {jobs.map((job) => (
          <Link
            to={`/jobs/${job.id}`}
            key={job.id}
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <div className="card">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <h3>{job.title}</h3>
                <span className="badge badge-blue">{job.jobType}</span>
              </div>
              <p style={{ color: "#666", marginBottom: 8 }}>
                {job.company?.name}
              </p>
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  fontSize: 14,
                  color: "#888",
                }}
              >
                <span>{job.location}</span>
                <span>{job.salaryRange}</span>
                <span>{job.experienceLevel}</span>
              </div>
              {job.skills?.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    gap: 6,
                    marginTop: 12,
                    flexWrap: "wrap",
                  }}
                >
                  {job.skills.map((s) => (
                    <span key={s} className="badge badge-green">
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
      {jobs.length === 0 && (
        <p style={{ textAlign: "center", color: "#666", padding: 40 }}>
          No jobs posted yet.
        </p>
      )}
    </div>
  );
}
