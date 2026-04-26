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
            <h3>{company.name}</h3>
            <p style={{ color: "#666", fontSize: 14, marginBottom: 8 }}>
              {company.industry} • {company.location}
            </p>
            <p>{company.description}</p>
            <p style={{ marginTop: 8, fontSize: 14, color: "#888" }}>
              {company.employeeCount} employees
            </p>
            <Link
              to={`/jobs?companyId=${company.id}`}
              className="btn btn-primary"
              style={{ marginTop: 12, display: "inline-block", fontSize: 14 }}
            >
              View Jobs
            </Link>
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
