import { useState } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { useQuery, useMutation } from "@apollo/client";
import {
  GET_REVIEWS,
  CREATE_REVIEW,
  GET_COMPANIES,
  GET_INTERVIEW_EXPERIENCES,
  CREATE_INTERVIEW_EXPERIENCE,
} from "../graphql/queries";
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

const DIFFICULTY_LABELS = ["", "Very Easy", "Easy", "Medium", "Hard", "Very Hard"];
const DIFFICULTY_COLORS = ["", "#22c55e", "#84cc16", "#eab308", "#f97316", "#ef4444"];

function DifficultyBadge({ value }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 10px",
        borderRadius: 12,
        fontSize: 13,
        fontWeight: 600,
        background: DIFFICULTY_COLORS[value] + "22",
        color: DIFFICULTY_COLORS[value],
      }}
    >
      {DIFFICULTY_LABELS[value]}
    </span>
  );
}

const RESULT_OPTIONS = ["Got Offer", "No Offer", "Declined", "Ghosted"];

export default function CompanyDetailPage() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "reviews");

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [positionTitle, setPositionTitle] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [iePositionTitle, setIePositionTitle] = useState("");
  const [ieDifficulty, setIeDifficulty] = useState(0);
  const [ieResult, setIeResult] = useState("");
  const [ieDescription, setIeDescription] = useState("");
  const [ieInterviewDate, setIeInterviewDate] = useState("");
  const [ieSubmitted, setIeSubmitted] = useState(false);

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

  const {
    data: ieData,
    loading: ieLoading,
    refetch: ieRefetch,
  } = useQuery(GET_INTERVIEW_EXPERIENCES, {
    variables: { companyId: id, page: 1, limit: 50 },
  });

  const [createInterviewExperience, { loading: ieSubmitting, error: ieError }] =
    useMutation(CREATE_INTERVIEW_EXPERIENCE, {
      onCompleted: () => {
        setIeSubmitted(true);
        setIePositionTitle("");
        setIeDifficulty(0);
        setIeResult("");
        setIeDescription("");
        setIeInterviewDate("");
        ieRefetch();
      },
    });

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

  const handleIeSubmit = (e) => {
    e.preventDefault();
    if (ieDifficulty < 1 || !iePositionTitle.trim()) return;
    createInterviewExperience({
      variables: {
        companyId: id,
        positionTitle: iePositionTitle,
        difficulty: ieDifficulty,
        result: ieResult || undefined,
        description: ieDescription || undefined,
        interviewDate: ieInterviewDate || undefined,
      },
    });
  };

  const reviews = reviewsData?.reviews?.reviews || [];
  const averageRating = reviewsData?.reviews?.averageRating || 0;
  const totalReviews = reviewsData?.reviews?.total || 0;

  const interviewExperiences =
    ieData?.interviewExperiences?.interviewExperiences || [];
  const totalInterviews = ieData?.interviewExperiences?.total || 0;
  const averageDifficulty = ieData?.interviewExperiences?.averageDifficulty || 0;

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

      <div style={{ display: "flex", gap: 0, marginBottom: 24 }}>
        <button
          className={activeTab === "reviews" ? "btn btn-primary" : "btn btn-secondary"}
          onClick={() => handleTabChange("reviews")}
          style={{ borderRadius: "8px 0 0 8px", flex: 1 }}
        >
          Reviews ({totalReviews})
        </button>
        <button
          className={activeTab === "interviews" ? "btn btn-primary" : "btn btn-secondary"}
          onClick={() => handleTabChange("interviews")}
          style={{ borderRadius: "0 8px 8px 0", flex: 1 }}
        >
          Interviews ({totalInterviews})
        </button>
      </div>

      {activeTab === "reviews" && user?.role === "JOB_HUNTER" && !submitted && (
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

      {activeTab === "reviews" && submitted && (
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

      {activeTab === "reviews" && <div className="card">
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
      </div>}

      {activeTab === "interviews" && user?.role === "JOB_HUNTER" && !ieSubmitted && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ marginBottom: 16 }}>Share Interview Experience</h3>
          {ieError && <p className="error">{ieError.message}</p>}
          <form onSubmit={handleIeSubmit}>
            <div className="form-group">
              <label>Position Title *</label>
              <input
                type="text"
                value={iePositionTitle}
                onChange={(e) => setIePositionTitle(e.target.value)}
                placeholder="e.g. Software Engineer"
                required
              />
            </div>
            <div className="form-group">
              <label>Difficulty *</label>
              <div style={{ display: "flex", gap: 8 }}>
                {[1, 2, 3, 4, 5].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setIeDifficulty(level)}
                    style={{
                      padding: "6px 14px",
                      borderRadius: 8,
                      border: ieDifficulty === level ? "2px solid " + DIFFICULTY_COLORS[level] : "1px solid #ddd",
                      background: ieDifficulty === level ? DIFFICULTY_COLORS[level] + "22" : "#fff",
                      color: DIFFICULTY_COLORS[level],
                      fontWeight: 600,
                      cursor: "pointer",
                      fontSize: 13,
                    }}
                  >
                    {DIFFICULTY_LABELS[level]}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label>Result</label>
              <select
                value={ieResult}
                onChange={(e) => setIeResult(e.target.value)}
              >
                <option value="">Select result...</option>
                {RESULT_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Interview Date</label>
              <input
                type="date"
                value={ieInterviewDate}
                onChange={(e) => setIeInterviewDate(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                rows={4}
                value={ieDescription}
                onChange={(e) => setIeDescription(e.target.value)}
                placeholder="Describe your interview experience..."
              />
            </div>
            <button
              className="btn btn-primary"
              disabled={ieSubmitting || ieDifficulty < 1 || !iePositionTitle.trim()}
            >
              {ieSubmitting ? "Submitting..." : "Submit Interview Experience"}
            </button>
          </form>
        </div>
      )}

      {activeTab === "interviews" && ieSubmitted && (
        <div
          className="card"
          style={{
            background: "#d4edda",
            textAlign: "center",
            marginBottom: 24,
          }}
        >
          <p style={{ fontWeight: 600, color: "#155724" }}>
            Interview experience submitted successfully!
          </p>
        </div>
      )}

      {activeTab === "interviews" && <div className="card">
        <h3 style={{ marginBottom: 16 }}>
          Interview Experiences ({totalInterviews})
        </h3>
        {totalInterviews > 0 && (
          <p style={{ marginBottom: 16, color: "#555" }}>
            Average Difficulty:{" "}
            <strong>{averageDifficulty.toFixed(1)}</strong> / 5
          </p>
        )}
        {ieLoading && <p>Loading interview experiences...</p>}
        {interviewExperiences.length === 0 && !ieLoading && (
          <p style={{ color: "#666" }}>
            No interview experiences yet. Be the first to share!
          </p>
        )}
        {interviewExperiences.map((ie) => (
          <div
            key={ie.id}
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
                <strong>{ie.positionTitle}</strong>
                <DifficultyBadge value={ie.difficulty} />
              </div>
              <span style={{ color: "#999", fontSize: 13 }}>
                {ie.interviewDate
                  ? new Date(ie.interviewDate).toLocaleDateString()
                  : new Date(ie.createdAt).toLocaleDateString()}
              </span>
            </div>
            {ie.result && (
              <p style={{ marginTop: 4, fontSize: 14, fontWeight: 600, color: "#555" }}>
                Result: {ie.result}
              </p>
            )}
            {ie.description && (
              <p style={{ marginTop: 8, color: "#444" }}>{ie.description}</p>
            )}
          </div>
        ))}
      </div>}
    </div>
  );
}
