import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Default center (India)
const DEFAULT_CENTER = [20.5937, 78.9629];

// Fix Leaflet default icon paths when bundling
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

const JobsMap = ({ jobs }) => {
  const jobsWithCoords = (jobs || []).filter(
    (j) => typeof j.latitude === 'number' && typeof j.longitude === 'number'
  );

  if (jobsWithCoords.length === 0) {
    return null;
  }

  const center = [jobsWithCoords[0].latitude, jobsWithCoords[0].longitude];

  return (
    <div className="mb-6 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <div className="px-4 pt-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Jobs Map</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">Locations based on latitude/longitude in job posts.</p>
        </div>
      </div>
      <div className="h-72 mt-2">
        <MapContainer center={center || DEFAULT_CENTER} zoom={5} className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {jobsWithCoords.map((job) => (
            <Marker key={job._id} position={[job.latitude, job.longitude]}>
              <Popup>
                <div className="space-y-1">
                  <div className="font-semibold text-sm">{job.title}</div>
                  {job.location && <div className="text-xs text-gray-600">{job.location}</div>}
                  {job.salary != null && (
                    <div className="text-xs text-gray-700">Salary: ₹{job.salary}</div>
                  )}
                  {job.vehicleType && (
                    <div className="text-xs text-gray-700">Vehicle: {job.vehicleType}</div>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
};

export default JobsMap;
