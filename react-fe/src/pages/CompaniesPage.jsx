import { useQuery } from "@apollo/client";
import { Link } from "react-router-dom";
import { GET_COMPANIES } from "../graphql/queries";

export default function CompaniesPage() {
  const { data, loading, error } = useQuery(GET_COMPANIES, {
    variables: { page: 1, limit: 20 },
  });

  if (loading) return <div className="loading">Loading companies...</div>;
  if (error) return <div className="error">Error: {error.message}</div>;

  const { companies, total } = data.companies;

  return (
    <div>
      <div className="page-header">
        <h1>Companies ({total})</h1>
      </div>
      <div className="grid grid-3">
        {companies.map((company) => (
          <div className="card" key={company.id}>
            <Link
              to={`/companies/${company.id}`}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <h3>{company.name}</h3>
            </Link>
            <p style={{ color: "#666", fontSize: 14, marginBottom: 8 }}>
              {company.industry} • {company.location}
            </p>
            <p>{company.description}</p>
            <p style={{ marginTop: 8, fontSize: 14, color: "#888" }}>
              {company.employeeCount} employees
            </p>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginTop: 8,
              }}
            >
              <span style={{ color: "#f59e0b", fontSize: 18 }}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <span
                    key={s}
                    style={{
                      color:
                        s <= Math.round(company.averageRating || 0)
                          ? "#f59e0b"
                          : "#d1d5db",
                    }}
                  >
                    ★
                  </span>
                ))}
              </span>
              <span style={{ fontSize: 14, fontWeight: 600 }}>
                {(company.averageRating || 0).toFixed(1)}
              </span>
              <span style={{ fontSize: 13, color: "#888" }}>
                ({company.reviews?.total || 0}{" "}
                {company.reviews?.total === 1 ? "review" : "reviews"})
              </span>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <Link
                to={`/jobs?companyId=${company.id}`}
                className="btn btn-primary"
                style={{ display: "inline-block", fontSize: 14 }}
              >
                View Jobs
              </Link>
              <Link
                to={`/companies/${company.id}`}
                className="btn btn-secondary"
                style={{ display: "inline-block", fontSize: 14 }}
              >
                Reviews
              </Link>
            </div>
          </div>
        ))}
      </div>
      {companies.length === 0 && (
        <p style={{ textAlign: "center", color: "#666", padding: 40 }}>
          No companies yet.
        </p>
      )}
    </div>
  );
}
