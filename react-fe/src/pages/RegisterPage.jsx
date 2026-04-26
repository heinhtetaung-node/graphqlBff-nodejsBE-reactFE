import { useState } from "react";
import { useMutation } from "@apollo/client";
import { useNavigate, Link } from "react-router-dom";
import { REGISTER, CREATE_COMPANY } from "../graphql/queries";
import { useAuth } from "../context/AuthContext";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    email: "",
    password: "",
    name: "",
    role: "JOB_HUNTER",
    phone: "",
    bio: "",
  });
  const [companyForm, setCompanyForm] = useState({
    name: "",
    description: "",
    website: "",
    industry: "",
    location: "",
    employeeCount: "",
  });
  const [error, setError] = useState("");

  const [registerMutation, { loading: registerLoading }] = useMutation(
    REGISTER,
    {
      onCompleted: (data) => {
        login(data.register.token, data.register.user);
        if (form.role === "TALENT_HUNTER") {
          setStep(2);
          setError("");
        } else {
          navigate("/dashboard");
        }
      },
      onError: (err) => setError(err.message),
    },
  );

  const [createCompany, { loading: companyLoading }] = useMutation(
    CREATE_COMPANY,
    {
      onCompleted: () => navigate("/dashboard"),
      onError: (err) => setError(err.message),
    },
  );

  const handleRegister = (e) => {
    e.preventDefault();
    setError("");
    registerMutation({ variables: form });
  };

  const handleCompany = (e) => {
    e.preventDefault();
    setError("");
    const vars = { ...companyForm };
    if (vars.employeeCount)
      vars.employeeCount = parseInt(vars.employeeCount, 10);
    else delete vars.employeeCount;
    createCompany({ variables: vars });
  };

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  const setC = (key) => (e) =>
    setCompanyForm({ ...companyForm, [key]: e.target.value });

  if (step === 2) {
    return (
      <div style={{ maxWidth: 440, margin: "60px auto" }}>
        <div className="card">
          <h2 style={{ marginBottom: 8 }}>Set Up Your Company</h2>
          <p style={{ color: "#666", marginBottom: 24 }}>
            Tell us about your company so you can start posting jobs.
          </p>
          {error && <p className="error">{error}</p>}
          <form onSubmit={handleCompany}>
            <div className="form-group">
              <label>Company Name *</label>
              <input
                required
                value={companyForm.name}
                onChange={setC("name")}
              />
            </div>
            <div className="form-group">
              <label>Industry</label>
              <select value={companyForm.industry} onChange={setC("industry")}>
                <option value="">Select industry...</option>
                <option value="Technology">Technology</option>
                <option value="Finance">Finance</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Education">Education</option>
                <option value="Retail">Retail</option>
                <option value="Manufacturing">Manufacturing</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label>Location</label>
              <input
                value={companyForm.location}
                onChange={setC("location")}
                placeholder="e.g. San Francisco, CA"
              />
            </div>
            <div className="form-group">
              <label>Website</label>
              <input
                value={companyForm.website}
                onChange={setC("website")}
                placeholder="https://"
              />
            </div>
            <div className="form-group">
              <label>Number of Employees</label>
              <input
                type="number"
                min="1"
                value={companyForm.employeeCount}
                onChange={setC("employeeCount")}
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                rows={3}
                value={companyForm.description}
                onChange={setC("description")}
                placeholder="What does your company do?"
              />
            </div>
            <button
              className="btn btn-primary"
              style={{ width: "100%" }}
              disabled={companyLoading}
            >
              {companyLoading ? "Creating company..." : "Create Company"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 440, margin: "60px auto" }}>
      <div className="card">
        <h2 style={{ marginBottom: 24 }}>Register</h2>
        {error && <p className="error">{error}</p>}
        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label>Name</label>
            <input required value={form.name} onChange={set("name")} />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={set("email")}
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={set("password")}
            />
          </div>
          <div className="form-group">
            <label>I am a...</label>
            <select value={form.role} onChange={set("role")}>
              <option value="JOB_HUNTER">Job Hunter (looking for work)</option>
              <option value="TALENT_HUNTER">Talent Hunter (hiring)</option>
            </select>
          </div>
          <div className="form-group">
            <label>Phone (optional)</label>
            <input value={form.phone} onChange={set("phone")} />
          </div>
          <div className="form-group">
            <label>Bio (optional)</label>
            <textarea rows={3} value={form.bio} onChange={set("bio")} />
          </div>
          <button
            className="btn btn-primary"
            style={{ width: "100%" }}
            disabled={registerLoading}
          >
            {registerLoading ? "Creating account..." : "Register"}
          </button>
        </form>
        <p style={{ marginTop: 16, textAlign: "center" }}>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}
