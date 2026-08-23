import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <header className="bg-black text-center px-6 py-12">
        <h2 className="text-5xl md:text-6xl font-extrabold text-yellow-400 mb-6 tracking-wide drop-shadow-lg">
            Save Paws
        </h2>
        {/* Banner image */}
        <img
          src="/puppy-banner.jpg"
          alt="Rescue animals banner"
          className="w-full max-h-[400px] object-contain mx-auto mb-6"
        />

        {/* Text below */}
        <h1 className="text-4xl md:text-6xl font-extrabold text-white">
          Help Animals in Need 🐶🐾
        </h1>
        <p className="mt-4 text-lg md:text-xl text-gray-300 max-w-2xl mx-auto">
          Join <span className="font-bold text-yellow-400">SavePaws</span>: 
          a community of volunteers and donors working together to rescue and care
          for animals. Every little effort counts.
        </p>
        <div className="mt-6 flex justify-center gap-4">
          <Link
            to="/volunteers"
            className="bg-yellow-400 text-black font-semibold px-6 py-2 rounded-full hover:bg-yellow-300 transition"
          >
            Get Started
          </Link>
          <Link
            to="/donate"
            className="bg-gray-800 text-white px-6 py-2 rounded-full hover:bg-gray-700 transition"
          >
            Donate Now
          </Link>
        </div>
      </header>



      {/* FEATURES */}
      <section className="py-20 px-6 text-center bg-white">
        <h2 className="text-sm font-semibold text-yellow-600 tracking-widest mb-2">
          FEATURES
        </h2>
        <h3 className="text-3xl md:text-4xl font-bold mb-6">
          Everything you need to make a difference
        </h3>
        <p className="text-gray-600 max-w-2xl mx-auto mb-12">
          From rescue operations to transparent donations, SavePaws gives you the tools to
          change lives.
        </p>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto text-left">
          {[
            { title: '🐾 Animal Rescue', desc: 'Report stray animals, join missions, and track rescues in real time.' },
            { title: '🤝 Team Collaboration', desc: 'Coordinate with volunteers, assign roles, and chat seamlessly.' },
            { title: '🛒 Supply Marketplace', desc: 'Donate or redeem credits for food, medicine, and shelter supplies.' },
            { title: '📊 Real-Time Analytics', desc: 'Visualize your impact with dashboards on rescues & donations.' },
            { title: '📍 Geo Tracking', desc: 'Locate animals in distress using GPS-enabled reporting tools.' },
            { title: '❤️ Donor Transparency', desc: 'See exactly how your donations are spent, with receipts.' },
          ].map((f, i) => (
            <div
              key={i}
              className="bg-gray-50 p-6 rounded-xl shadow-sm hover:shadow-lg transition"
            >
              <h4 className="text-xl font-semibold mb-2">{f.title}</h4>
              <p className="text-gray-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* IMPACT STATS */}
      <section className="bg-yellow-50 py-16">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8 text-center">
          <div>
            <h3 className="text-5xl font-extrabold text-yellow-600">5,000+</h3>
            <p className="text-gray-700 mt-2">Animals Rescued</p>
          </div>
          <div>
            <h3 className="text-5xl font-extrabold text-yellow-600">2,000+</h3>
            <p className="text-gray-700 mt-2">Active Volunteers</p>
          </div>
          <div>
            <h3 className="text-5xl font-extrabold text-yellow-600">$250K</h3>
            <p className="text-gray-700 mt-2">Donations Raised</p>
          </div>
        </div>
      </section>

      {/* CALL TO ACTION */}
      <section className="bg-yellow-400 py-16 text-center">
        <h3 className="text-3xl md:text-4xl font-extrabold text-black mb-6">
          Ready to make a difference?
        </h3>
        <p className="text-black max-w-xl mx-auto mb-8">
          Whether you donate, volunteer, or foster: together we can build a safe world for animals.
        </p>
        <div className="flex justify-center gap-4">
          <Link
            to="/register"
            className="bg-black text-white px-8 py-3 rounded-full font-semibold hover:bg-gray-800 transition"
          >
            Join Us
          </Link>
          <Link
            to="/about"
            className="bg-white text-black px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition"
          >
            Learn More
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
