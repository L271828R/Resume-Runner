// Ensure CRA dev server runs even when LAN IP can't be detected
process.env.DANGEROUSLY_DISABLE_HOST_CHECK = 'true';

// Defer to the default CRA start script
require('react-scripts/scripts/start');
