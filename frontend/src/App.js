import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import Navigation from './components/Navigation';
import Dashboard from './pages/Dashboard';
import Applications from './pages/Applications';
import ResumeVersions from './pages/ResumeVersions';
import Companies from './pages/Companies';
import CompanyDetail from './pages/CompanyDetail';
import Recruiters from './pages/Recruiters';
import RecruiterDetail from './pages/RecruiterDetail';
import ApplicationDetail from './pages/ApplicationDetail';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="App">
          <Navigation />
          <main style={{ paddingTop: '80px' }}>
            <div className="container">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/applications" element={<Applications />} />
                <Route path="/applications/:id" element={<ApplicationDetail />} />
                <Route path="/resume-versions" element={<ResumeVersions />} />
                <Route path="/companies" element={<Companies />} />
                <Route path="/companies/:id" element={<CompanyDetail />} />
                <Route path="/recruiters" element={<Recruiters />} />
                <Route path="/recruiters/:id" element={<RecruiterDetail />} />
              </Routes>
            </div>
          </main>
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;