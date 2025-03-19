import { useEffect, useState } from "react";
import Search from "./components/Search";
import "./index.css";
import Loader from "./components/Loader";
import MovieCard from "./components/MovieCard";
import { useDebounce } from "react-use";
import { getTrendingMovies, updateSearchCount } from "./appwrite";

const url = "https://api.themoviedb.org/3";
const options = {
  method: "GET",
  headers: {
    accept: "application/json",
    Authorization: `Bearer ${import.meta.env.VITE_TMDB_API_KEY}`,
  },
};

function App() {
  const [search, setSearch] = useState("");
  const [debouncSearch, setDebouncSearch] = useState("");
  const [error, setError] = useState(null);
  const [trendingError, setTrendingError] = useState(null);
  const [movieList, setMovieList] = useState([]);
  const [tendingMovieList, setTendingMovieList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingTrend, setLoadingTrend] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useDebounce(() => setDebouncSearch(search), 1000, [search]);

  const fetchMovie = async (query = "", page = 1) => {
    setLoading(true);
    setError(null);

    try {
      const endpoint = query
        ? `${url}/search/movie?query=${encodeURIComponent(query)}&page=${page}`
        : `${url}/discover/movie?sort_by=popularity.desc&page=${page}`;

      const res = await fetch(endpoint, options);

      if (!res.ok) {
        throw new Error("Failed to fetch movies");
      }

      const data = await res.json();

      if (!data.results) {
        setError("No movies found");
        setMovieList([]);
        return;
      }

      setMovieList(data.results || []);

      if (query && data.results.length > 0) {
        await updateSearchCount(query, data.results[0]);
      }
    } catch (err) {
      console.error(err);
      setError("Error fetching movie from server please try again!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovie(debouncSearch, currentPage);
  }, [debouncSearch, currentPage]);

  const loadTrendingMovies = async () => {
    setLoadingTrend(true);
    try {
      const movies = await getTrendingMovies();
      setTendingMovieList(movies);
    } catch (error) {
      console.error(`Error fetching trending movies: ${error}`);
      setTrendingError("Error fetching movie from server please try again!");
    } finally {
      setLoadingTrend(false);
    }
  };

  useEffect(() => {
    loadTrendingMovies();
  }, []);

  return (
    <>
      <main>
        <div className="pattern" />
        <div className="wrapper">
          <header>
            <img src="/hero.png" alt="hero banner" />
            <h1>
              Find <span className="text-gradient">Movies</span> You'll Enjoy
              Without the Hassle
            </h1>
            <Search search={search} setSearch={setSearch} />
          </header>
          {tendingMovieList.length > 0 && (
            <section className="trending">
              <h2>Trending Movies</h2>
              {loadingTrend ? (
                <Loader />
              ) : trendingError ? (
                <h2 className="text-red-500">{trendingError}</h2>
              ) : (
                <ul>
                  {tendingMovieList.map((movie, index) => (
                    <li key={movie.$id}>
                      <p>{index + 1}</p>
                      <img src={movie.poster_url} alt={movie.title} />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
          <section className="all-movies">
            <h2 className="mt-4">All Movies</h2>
            {loading ? (
              <Loader />
            ) : error ? (
              <h2 className="text-red-500">{error}</h2>
            ) : (
              <>
                <ul>
                  {movieList.map((movie) => (
                    <MovieCard key={movie.id} movie={movie} />
                  ))}
                </ul>
                <div className="pagination flex items-center justify-center gap-4 mt-8 mb-4">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((prev) => prev - 1)}
                    className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
                      currentPage === 1
                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                        : "bg-blue-600 text-white hover:bg-blue-700 active:scale-95"
                    }`}
                  >
                    Previous
                  </button>
                  <span className="text-lg font-semibold text-gray-700">
                    Page {currentPage}
                  </span>
                  <button
                    onClick={() => setCurrentPage((prev) => prev + 1)}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 active:scale-95 transition-all duration-200"
                  >
                    Next
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      </main>
    </>
  );
}

export default App;
