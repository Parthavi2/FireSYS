const path = require('path');
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const incidentRoutes = require('./routes/incidentRoutes');
const firefighterRoutes = require('./routes/firefighterRoutes');
const truckRoutes = require('./routes/truckRoutes');
const dispatchRoutes = require('./routes/dispatchRoutes');
const stationRoutes = require('./routes/stationRoutes');
const userRoutes = require('./routes/userRoutes');
const maintenanceRoutes = require('./routes/maintenanceRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());

// Serves the redesigned frontend directly from the API server, so the
// whole app runs at http://localhost:PORT with no separate static server.
app.use(express.static(path.join(__dirname, '../frontend')));

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/firefighters', firefighterRoutes);
app.use('/api/trucks', truckRoutes);
app.use('/api/dispatch', dispatchRoutes);
app.use('/api/stations', stationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/analytics', analyticsRoutes);

// Must come after all routes: catches anything unmatched, then any
// error passed via next(err) from a controller.
app.use(notFound);
app.use(errorHandler);

module.exports = app;
