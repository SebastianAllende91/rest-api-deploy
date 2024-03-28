const express = require("express");
const cors = require("cors");
const crypto = require("node:crypto");

const moviesJson = require("./movies.json");
const { validateMovie, validateParcialMovie } = require("./schema/movies");

const app = express();
app.use(express.json());
//app.use(cors()); // si lo dejamos asi es lo mismo que poner esto ("Access-Control-Allow-Origin", "*")
app.use(
  cors({
    origin: (origin, callback) => {
      const ACCEPTED_ORIGINS = ["http:localhost:8080", "http://127.0.0.1:5500"];

      if (ACCEPTED_ORIGINS.includes(origin)) {
        return callback(null, true);
      }

      if (!origin) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
  })
);
app.disable("x-powered-by"); // desabilitar el header X-powered-by:Express

const PORT = process.env.PORT ?? 1234;

// métodos normales: GET/HEAD/POST
// métodos complejos:PUT/PATCH/DELETE

//CORS PRE-FLIGHT
// OPTIONS

// Todos los recursos que sean MOVIES se identifican con /movies
app.get("/movies", (req, res) => {
  const { genre } = req.query;

  if (genre) {
    const filteredMovies = moviesJson.filter((movie) =>
      movie.genre.some((g) => g.toLowerCase() === genre.toLowerCase())
    );
    res.json(filteredMovies);
  }

  res.json(moviesJson);
});

app.get(`/movies/:id`, (req, res) => {
  // path-to-regex
  const { id } = req.params;
  console.log("id: ", id);
  const movie = moviesJson.find((movie) => movie.id === id);

  if (movie) return res.json(movie);

  res.status(404).send({ message: "Movie not found" });
});

app.post("/movies", (req, res) => {
  const result = validateMovie(req.body);

  if (result.error) {
    return res.status(400).json({ error: result.error.message });
  }

  const newMovie = {
    id: crypto.randomUUID(), // uuid v4
    ...result.data,
  };
  // Esto no seria REST, porque estamos guardando
  // el estado de la aplicacion en memoria
  moviesJson.push(newMovie);
  res.status(201).json(newMovie); // puede servir para actualizar la cache del cliente
});

app.patch("/movies/:id", (req, res) => {
  const resultado = validateParcialMovie(req.body);
  if (!resultado.success) {
    return res.status(400).send({ error: JSON.parse(resultado.error.message) });
  }
  const { id } = req.params;
  const movieIndex = moviesJson.findIndex((movie) => movie.id === id);

  if (movieIndex < 0) res.status(404).json({ message: "Movie not found" });

  const updateMovie = {
    ...moviesJson[movieIndex],
    ...resultado.data,
  };

  moviesJson[movieIndex] = updateMovie;
  return res.json(updateMovie);
});

app.delete("/movies/:id", (req, res) => {
  const { id } = req.params;
  const movieIndex = moviesJson.findIndex((movie) => movie.id === id);

  if (movieIndex < 0) {
    return res.status(404).json({ message: "Movie not Found" });
  }

  moviesJson.splice(movieIndex, 1);
  return res.json({ message: "Movie deleted" });
});

app.listen(PORT, () => {
  console.log(`Server listering of port http://localhost:${PORT}`);
});
