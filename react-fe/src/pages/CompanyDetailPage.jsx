import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation } from "@apollo/client";
import { GET_REVIEWS, CREATE_REVIEW, GET_COMPANIES } from "../graphql/queries";
import { useAuth } from "../context/AuthContext";

function StarRating({ value, onChange, readonly }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 4,
        cursor: readonly ? "default" : "pointer",
      }}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          onClick={() => !readonly && onChange?.(star)}
          style={{ fontSize: 24, color: star <= value ? "#f59e0b" : "#d1d5db" }}
        >
          ★
        </span>
      ))}
    </div>
  );
}

export default function CompanyDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [positionTitle, setPositionTitle] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const { data: companiesData } = useQuery(GET_COMPANIES, {
    variables: { page: 1, limit: 100 },
  });
  const company = companiesData?.companies?.companies?.find((c) => c.id === id);

  const {
    data: reviewsData,
    loading,
    refetch,
  } = useQuery(GET_REVIEWS, {
    variables: { companyId: id, page: 1, limit: 50 },
  });

  const [createReview, { loading: submitting, error }] = useMutation(
    CREATE_REVIEW,
    {
      onCompleted: () => {
        setSubmitted(true);
        setRating(0);
        setComment("");
        setPositionTitle("");
        refetch();
      },
    },
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (rating < 1) return;
    createReview({
      variables: {
        companyId: id,
        rating,
        comment,
        positionTitle: positionTitle || undefined,
      },
    });
  };

  const reviews = reviewsData?.reviews?.reviews || [];
  const averageRating = reviewsData?.reviews?.averageRating || 0;
  const totalReviews = reviewsData?.reviews?.total || 0;

  return (
    <div style={{ maxWidth: 800, margin: "32px auto" }}>
      {company && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h1>{company.name}</h1>
          <p style={{ color: "#666" }}>
            {company.industry} • {company.location}
          </p>
          {company.description && (
            <p style={{ marginTop: 12 }}>{company.description}</p>
          )}
          <div
            style={{ display: "flex", gap: 24, marginTop: 12, color: "#555" }}
          >
            {company.employeeCount > 0 && (
              <span>{company.employeeCount} employees</span>
            )}
            {company.website && (
              <a href={company.website} target="_blank" rel="noreferrer">
                {company.website}
              </a>
            )}
          </div>
          <div
            style={{
              marginTop: 16,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <StarRating value={Math.round(averageRating)} readonly />
            <span style={{ fontWeight: 600 }}>{averageRating.toFixed(1)}</span>
            <span style={{ color: "#666" }}>
              ({totalReviews} {totalReviews === 1 ? "review" : "reviews"})
            </span>
          </div>
          <Link
            to={`/jobs?companyId=${id}`}
            className="btn btn-primary"
            style={{ marginTop: 16, display: "inline-block" }}
          >
            View Jobs
          </Link>
        </div>
      )}

      {user?.role === "JOB_HUNTER" && !submitted && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ marginBottom: 16 }}>Write a Review</h3>
          {error && <p className="error">{error.message}</p>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Rating *</label>
              <StarRating value={rating} onChange={setRating} />
            </div>
            <div className="form-group">
              <label>Position Title (optional)</label>
              <input
                type="text"
                value={positionTitle}
                onChange={(e) => setPositionTitle(e.target.value)}
                placeholder="e.g. Software Engineer"
              />
            </div>
            <div className="form-group">
              <label>Comment</label>
              <textarea
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience with this company..."
              />
            </div>
            <button
              className="btn btn-primary"
              disabled={submitting || rating < 1}
            >
              {submitting ? "Submitting..." : "Submit Review"}
            </button>
          </form>
        </div>
      )}

      {submitted && (
        <div
          className="card"
          style={{
            background: "#d4edda",
            textAlign: "center",
            marginBottom: 24,
          }}
        >
          <p style={{ fontWeight: 600, color: "#155724" }}>
            Review submitted successfully!
          </p>
        </div>
      )}

      <div className="card">
        <h3 style={{ marginBottom: 16 }}>Reviews ({totalReviews})</h3>
        {loading && <p>Loading reviews...</p>}
        {reviews.length === 0 && !loading && (
          <p style={{ color: "#666" }}>
            No reviews yet. Be the first to review!
          </p>
        )}
        {reviews.map((review) => (
          <div
            key={review.id}
            style={{
              borderBottom: "1px solid #eee",
              paddingBottom: 16,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <StarRating value={review.rating} readonly />
                <strong>{review.positionTitle || "Former Employee"}</strong>
              </div>
              <span style={{ color: "#999", fontSize: 13 }}>
                {new Date(review.createdAt).toLocaleDateString()}
              </span>
            </div>
            {review.comment && (
              <p style={{ marginTop: 8, color: "#444" }}>{review.comment}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
