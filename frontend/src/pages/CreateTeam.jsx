import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

const backendUrl = "http://localhost:4000";

const CreateTeamPage = () => {
  const [teamName, setTeamName] = useState("");
  const [location, setLocation] = useState("");
  const [teamType, setTeamType] = useState("Rescue"); // NEW
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(`${backendUrl}/api/teams`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ teamName, location, teamType }), // NEW
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create team");

      console.log("Team created:", data);
      // go back to Teams so you can immediately see filters working
      navigate("/teams");
    } catch (err) {
      console.error("Error:", err.message);
      alert(err.message || "Failed to create team");
    }
  };

  return (
    <>
      <Navbar />
      <div className="h-[20vh]" />
      <form
        onSubmit={handleSubmit}
        className="max-w-md mx-auto p-4 bg-white rounded-xl shadow-xl border"
      >
        <h2 className="text-xl font-bold mb-4">Create a Team</h2>

        <div className="mb-4">
          <label className="block mb-1 font-medium">Team Name</label>
          <input
            type="text"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            className="w-full p-2 border rounded-xl focus:outline-none focus:ring focus:ring-blue-400"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1 font-medium">Location</label>
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full p-2 border rounded-xl focus:outline-none focus:ring focus:ring-blue-400"
            required
          >
            <option value="" disabled>Select a location</option>
            <option value="Gulshan">Gulshan</option>
            <option value="Badda">Badda</option>
            <option value="Mirpur">Mirpur</option>
            <option value="Uttara">Uttara</option>
            <option value="Banani">Banani</option>
            <option value="Dhanmondi">Dhanmondi</option>
            <option value="Mohammadpur">Mohammadpur</option>
            <option value="Puran Dhaka">Puran Dhaka</option>
            <option value="Moghbazar">Moghbazar</option>
          </select>
        </div>

        {/* NEW: Team Type */}
        <div className="mb-4">
          <label className="block mb-1 font-medium">Team Type</label>
          <select
            value={teamType}
            onChange={(e) => setTeamType(e.target.value)}
            className="w-full p-2 border rounded-xl focus:outline-none focus:ring focus:ring-blue-400 bg-white"
          >
            <option value="Rescue">Rescue</option>
            <option value="Medical">Medical</option>
          </select>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700 transition"
        >
          Create Team
        </button>
      </form>
    </>
  );
};

export default CreateTeamPage;
