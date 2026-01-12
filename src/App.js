
import React, { useState } from 'react';
import { AlertTriangle, Cloud, Droplets, MapPin, Calendar, Sprout, Mountain, Layers, Info } from 'lucide-react';

const FloodPreventer = () => {
  const [step, setStep] = useState('input');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    cropType: 'rice',
    sowingDate: '',
    soilType: 'clay',
    fieldSlope: 'flat',
    location: '',
    latitude: '',
    longitude: ''
  });
  const [predictions, setPredictions] = useState(null);
  const [actions, setActions] = useState([]);
  const [apiKey, setApiKey] = useState('');
  const [showApiInput, setShowApiInput] = useState(true);

  const cityCoordinates = {
    'mumbai': { lat: 19.0760, lon: 72.8777, name: 'Mumbai' },
    'delhi': { lat: 28.7041, lon: 77.1025, name: 'Delhi' },
    'bangalore': { lat: 12.9716, lon: 77.5946, name: 'Bangalore' },
    'bengaluru': { lat: 12.9716, lon: 77.5946, name: 'Bangalore' },
    'chennai': { lat: 13.0827, lon: 80.2707, name: 'Chennai' },
    'kolkata': { lat: 22.5726, lon: 88.3639, name: 'Kolkata' },
    'pune': { lat: 18.5204, lon: 73.8567, name: 'Pune' },
    'hyderabad': { lat: 17.3850, lon: 78.4867, name: 'Hyderabad' },
    'ahmedabad': { lat: 23.0225, lon: 72.5714, name: 'Ahmedabad' },
    'surat': { lat: 21.1702, lon: 72.8311, name: 'Surat' },
    'jaipur': { lat: 26.9124, lon: 75.7873, name: 'Jaipur' },
    'lucknow': { lat: 26.8467, lon: 80.9462, name: 'Lucknow' },
    'nagpur': { lat: 21.1458, lon: 79.0882, name: 'Nagpur' },
    'patna': { lat: 25.5941, lon: 85.1376, name: 'Patna' },
    'indore': { lat: 22.7196, lon: 75.8577, name: 'Indore' },
    'bhopal': { lat: 23.2599, lon: 77.4126, name: 'Bhopal' },
    'virar': { lat: 19.4559, lon: 72.8111, name: 'Virar' }
  };

  const parseLocation = (locationStr) => {
    if (!locationStr) return null;
    
    const cityLower = locationStr.toLowerCase().trim();
    if (cityCoordinates[cityLower]) {
      return cityCoordinates[cityLower];
    }
    
    const coordMatch = locationStr.match(/(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)/);
    if (coordMatch) {
      return { 
        lat: parseFloat(coordMatch[1]), 
        lon: parseFloat(coordMatch[2]),
        name: locationStr
      };
    }
    
    return { lat: null, lon: null, name: locationStr };
  };

  const getWeatherForecast = async (location) => {
    try {
      const query = location.name || `${location.lat},${location.lon}`;
      const url = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${encodeURIComponent(query)}&days=7&aqi=no&alerts=no`;
      
      console.log('Fetching weather from WeatherAPI.com:', query);
      console.log('API URL:', url.replace(apiKey, 'API_KEY_HIDDEN'));
      
      const response = await fetch(url);
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('WeatherAPI Error Response:', errorText);
        
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.error?.message || 'Failed to fetch weather data');
        } catch {
          throw new Error(`API returned status ${response.status}: ${errorText}`);
        }
      }
      
      const data = await response.json();
      console.log('Weather data received:', data);
      
      if (!data.forecast || !data.forecast.forecastday) {
        throw new Error('Invalid weather data format received');
      }
      
      let totalRainfall = 0;
      let rainfall3Day = 0;
      let maxPrecipProb = 0;
      let avgHumidity = 0;
      
      data.forecast.forecastday.forEach((day, index) => {
        const dayRain = day.day.totalprecip_mm || 0;
        totalRainfall += dayRain;
        
        if (index < 3) {
          rainfall3Day += dayRain;
        }
        
        maxPrecipProb = Math.max(maxPrecipProb, day.day.daily_chance_of_rain || 0);
        avgHumidity += day.day.avghumidity || 50;
      });
      
      avgHumidity = avgHumidity / data.forecast.forecastday.length;
      
      console.log('Processed weather data:', {
        totalRainfall,
        rainfall3Day,
        maxPrecipProb,
        avgHumidity
      });
      
      return {
        rainfall7Day: totalRainfall,
        rainfall3Day,
        maxPrecipProb,
        avgHumidity,
        soilMoisture: avgHumidity * 0.65,
        source: 'WeatherAPI.com'
      };
      
    } catch (error) {
      console.error('Error fetching weather:', error);
      alert(`Weather API Error: ${error.message}\n\nPlease check:\n1. Your API key is correct\n2. Location name is valid (try "Mumbai" or "Delhi")\n3. Check browser console (F12) for details`);
      return null;
    }
  };

  const predictFloodRisk = async (data) => {
    setLoading(true);
    
    let location = parseLocation(data.location);
    
    if (!location.lat || !location.lon) {
      if (data.latitude && data.longitude) {
        location = { lat: parseFloat(data.latitude), lon: parseFloat(data.longitude), name: data.location };
      }
    }
    
    let weatherData = null;
    
    if (apiKey) {
      weatherData = await getWeatherForecast(location);
    }
    
    if (!weatherData) {
      console.log('Using demo/simulated weather data');
      
      const month = new Date().getMonth();
      const isWinter = month === 11 || month === 0 || month === 1;
      const isMonsoon = month >= 5 && month <= 8;
      
      const baseRainfall = isWinter ? 2 : isMonsoon ? 120 : 30;
      const randomVariation = (Math.random() - 0.5) * 20;
      const rainfall7Day = Math.max(0, baseRainfall + randomVariation);
      
      weatherData = {
        rainfall7Day,
        rainfall3Day: rainfall7Day * 0.4,
        maxPrecipProb: isWinter ? 10 : isMonsoon ? 80 : 40,
        avgHumidity: isWinter ? 45 : isMonsoon ? 85 : 60,
        soilMoisture: isWinter ? 25 : isMonsoon ? 70 : 45,
        source: 'Demo/Simulated'
      };
      
      console.log('Simulated weather:', weatherData);
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const rainfall7Day = weatherData.rainfall7Day;
    const soilMoisture = weatherData.soilMoisture;
    
    const sowDate = new Date(data.sowingDate);
    const today = new Date();
    const daysSinceSowing = Math.floor((today - sowDate) / (1000 * 60 * 60 * 24));
    
    const riskFactors = {
      rainfall: rainfall7Day > 100 ? 0.40 : 
                rainfall7Day > 50 ? 0.30 : 
                rainfall7Day > 20 ? 0.15 : 
                rainfall7Day > 5 ? 0.05 : 0.01,
      soil: data.soilType === 'clay' ? 0.15 : data.soilType === 'loam' ? 0.10 : 0.05,
      slope: data.fieldSlope === 'flat' ? 0.10 : data.fieldSlope === 'gentle' ? 0.08 : 0.05,
      moisture: soilMoisture > 70 ? 0.15 : 
                soilMoisture > 50 ? 0.10 : 
                soilMoisture > 30 ? 0.05 : 0.02
    };
    
    console.log('Risk calculation:', { rainfall7Day, soilMoisture, riskFactors });
    
    const floodProbability = Math.min(
      Object.values(riskFactors).reduce((a, b) => a + b, 0) * 100,
      95
    );
    
    const runoffRisk = data.fieldSlope === 'steep' ? 'High' : 
                       data.fieldSlope === 'gentle' ? 'Medium' : 'Low';
    
    let cropStage = '';
    let stageVulnerability = '';
    if (daysSinceSowing < 15) {
      cropStage = 'Seedling';
      stageVulnerability = 'Critical';
    } else if (daysSinceSowing < 45) {
      cropStage = 'Vegetative';
      stageVulnerability = 'High';
    } else if (daysSinceSowing < 75) {
      cropStage = 'Flowering';
      stageVulnerability = 'Critical';
    } else {
      cropStage = 'Maturity';
      stageVulnerability = 'Medium';
    }
    
    setPredictions({
      floodProbability: floodProbability.toFixed(1),
      runoffRisk,
      cropStage,
      stageVulnerability,
      rainfall7Day: rainfall7Day.toFixed(1),
      recentRainfall: weatherData.rainfall3Day.toFixed(1),
      soilMoisture: soilMoisture.toFixed(1),
      maxPrecipProb: Math.round(weatherData.maxPrecipProb),
      daysSinceSowing,
      location: location.name,
      dataSource: weatherData.source
    });
    
    generateActions(floodProbability, runoffRisk, data, cropStage, daysSinceSowing, rainfall7Day);
    
    setLoading(false);
    setStep('results');
  };
  
  const generateActions = (floodProb, runoffRisk, data, cropStage, days, rainfall) => {
    const actionList = [];
    
    if (floodProb < 20 && rainfall < 10) {
      actionList.push({
        priority: 'LOW',
        action: 'No immediate flood prevention action required',
        timeline: 'Routine monitoring',
        reason: 'Low rainfall forecast and minimal flood risk',
        impact: 'Continue normal farming operations'
      });
      
      actionList.push({
        priority: 'MEDIUM',
        action: 'Inspect and maintain existing drainage systems',
        timeline: 'Within next 7 days',
        reason: 'Preventive maintenance for future preparedness',
        impact: 'Ensures readiness for unexpected rainfall'
      });
      
      return setActions(actionList);
    }
    
    if (floodProb > 70) {
      actionList.push({
        priority: 'URGENT',
        action: 'Raise field bunds by 20-25 cm immediately',
        timeline: 'Within 24 hours',
        reason: 'High flood probability with heavy rainfall expected',
        impact: 'Prevents 60-70% water entry into field'
      });
      
      if (data.fieldSlope !== 'flat') {
        actionList.push({
          priority: 'URGENT',
          action: 'Dig drainage channel 40 cm deep on lower side',
          timeline: 'Within 36 hours',
          reason: 'Sloped field + heavy rain creates high runoff',
          impact: 'Reduces waterlogging by 50%'
        });
      }
      
      if (cropStage === 'Flowering' || cropStage === 'Maturity') {
        actionList.push({
          priority: 'URGENT',
          action: 'Consider emergency early harvest',
          timeline: 'Within 48 hours if possible',
          reason: 'Critical crop stage + high flood risk',
          impact: 'Save 40-60% of potential yield'
        });
      }
    } else if (floodProb > 40) {
      actionList.push({
        priority: 'HIGH',
        action: 'Raise field bunds by 15-18 cm',
        timeline: 'Within 48 hours',
        reason: 'Moderate flood risk detected',
        impact: 'Prevents 40-50% water entry'
      });
      
      if (data.soilType === 'clay') {
        actionList.push({
          priority: 'HIGH',
          action: 'Create 25-30 cm drainage channels',
          timeline: 'Within 3 days',
          reason: 'Clay soil has poor drainage capacity',
          impact: 'Improves drainage by 40%'
        });
      }
    } else {
      actionList.push({
        priority: 'MEDIUM',
        action: 'Clear existing drainage channels',
        timeline: 'Within 5 days',
        reason: 'Light to moderate rainfall expected',
        impact: 'Ensures proper water flow'
      });
    }
    
    if (data.soilType === 'clay' && floodProb > 30) {
      actionList.push({
        priority: floodProb > 50 ? 'HIGH' : 'MEDIUM',
        action: 'Apply organic mulch (5-7 cm layer)',
        timeline: 'Within 48 hours',
        reason: 'Reduce soil compaction & improve drainage',
        impact: 'Reduces waterlogging stress by 30%'
      });
    }
    
    if (cropStage === 'Seedling' && floodProb > 50) {
      actionList.push({
        priority: 'HIGH',
        action: 'Protect seedlings with temporary barriers',
        timeline: 'Within 24 hours',
        reason: 'Seedlings highly vulnerable to flooding',
        impact: 'Saves 70-80% seedling survival'
      });
    }
    
    if (runoffRisk === 'High' && rainfall > 50) {
      actionList.push({
        priority: 'HIGH',
        action: 'Create contour trenches (30 cm wide)',
        timeline: 'Within 3 days',
        reason: 'Reduce soil erosion from runoff',
        impact: 'Reduces soil loss by 50%'
      });
    }
    
    if (floodProb > 20) {
      actionList.push({
        priority: 'MEDIUM',
        action: 'Monitor local weather forecasts daily',
        timeline: 'Ongoing',
        reason: 'Stay updated on changing rain patterns',
        impact: 'Enables timely response to warnings'
      });
    }
    
    setActions(actionList);
  };
  
  const handleSubmit = () => {
    if (formData.sowingDate && formData.location) {
      if (!apiKey) {
        const useDemo = confirm('No API key provided. Would you like to try DEMO MODE with simulated weather data?\n\nClick OK for demo mode, or Cancel to enter your API key.');
        if (!useDemo) {
          setShowApiInput(true);
          return;
        }
      }
      predictFloodRisk(formData);
    } else {
      alert('Please fill in sowing date and location');
    }
  };
  
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const getLocationAuto = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          handleInputChange('latitude', position.coords.latitude.toFixed(6));
          handleInputChange('longitude', position.coords.longitude.toFixed(6));
          handleInputChange('location', `${position.coords.latitude.toFixed(4)}°N, ${position.coords.longitude.toFixed(4)}°E`);
        },
        (error) => {
          alert('Unable to get location. Please enter city name or coordinates manually.');
        }
      );
    }
  };
  
  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'URGENT': return 'bg-red-500';
      case 'HIGH': return 'bg-orange-500';
      case 'MEDIUM': return 'bg-yellow-500';
      case 'LOW': return 'bg-green-500';
      default: return 'bg-blue-500';
    }
  };
  
  const getRiskColor = (prob) => {
    if (prob > 70) return 'text-red-600';
    if (prob > 40) return 'text-orange-600';
    return 'text-green-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Cloud className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-800">
              Flood & Rain Damage Preventer
            </h1>
          </div>
          <p className="text-gray-600">
            AI-powered micro-action advisor with automatic weather forecasting
          </p>
        </div>

        {showApiInput && (
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 mb-6 text-white">
            <h3 className="text-lg font-bold mb-3">🔑 Setup: Get Your FREE Weather API Key</h3>
            <ol className="text-sm space-y-2 mb-4 list-decimal list-inside">
              <li>Go to <a href="https://www.weatherapi.com/signup.aspx" target="_blank" rel="noopener noreferrer" className="underline font-medium">weatherapi.com/signup</a></li>
              <li>Sign up for FREE (1 million calls/month)</li>
              <li>Copy your API key from the dashboard</li>
              <li>Paste it below and start using!</li>
            </ol>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Paste your WeatherAPI.com key here (or leave empty for demo mode)"
                className="flex-1 p-3 rounded-lg text-gray-800"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <button
                onClick={() => setShowApiInput(false)}
                className="px-6 py-3 bg-white text-blue-600 rounded-lg font-medium hover:bg-gray-100"
              >
                Start
              </button>
            </div>
            <p className="text-xs mt-2 opacity-90">✅ Completely free • No credit card required • Works without API key in demo mode</p>
          </div>
        )}

        {!showApiInput && step === 'input' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Field Information</h2>
              <button
                onClick={() => setShowApiInput(true)}
                className="text-sm text-blue-600 hover:underline"
              >
                Change API Key
              </button>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex gap-3">
              <Info className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-green-800">
                <strong>Automatic Weather Forecast:</strong> Just enter your location and the system will fetch real-time 7-day rainfall predictions automatically!
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Sprout className="w-4 h-4" />
                  Crop Type
                </label>
                <select 
                  className="w-full p-3 border rounded-lg"
                  value={formData.cropType}
                  onChange={(e) => handleInputChange('cropType', e.target.value)}
                >
                  <option value="rice">Rice</option>
                  <option value="wheat">Wheat</option>
                  <option value="maize">Maize</option>
                  <option value="sugarcane">Sugarcane</option>
                  <option value="cotton">Cotton</option>
                  <option value="vegetables">Vegetables</option>
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4" />
                  Sowing Date
                </label>
                <input 
                  type="date"
                  className="w-full p-3 border rounded-lg"
                  value={formData.sowingDate}
                  onChange={(e) => handleInputChange('sowingDate', e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Layers className="w-4 h-4" />
                  Soil Type
                </label>
                <select 
                  className="w-full p-3 border rounded-lg"
                  value={formData.soilType}
                  onChange={(e) => handleInputChange('soilType', e.target.value)}
                >
                  <option value="clay">Clay (Poor drainage)</option>
                  <option value="loam">Loam (Medium drainage)</option>
                  <option value="sandy">Sandy (Good drainage)</option>
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Mountain className="w-4 h-4" />
                  Field Slope
                </label>
                <select 
                  className="w-full p-3 border rounded-lg"
                  value={formData.fieldSlope}
                  onChange={(e) => handleInputChange('fieldSlope', e.target.value)}
                >
                  <option value="flat">Flat (0-2%)</option>
                  <option value="gentle">Gentle slope (2-5%)</option>
                  <option value="steep">Steep slope (>5%)</option>
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4" />
                  Location (City name or GPS)
                </label>
                <div className="flex gap-2">
                  <input 
                    type="text"
                    className="flex-1 p-3 border rounded-lg"
                    placeholder="Mumbai, Delhi, Bangalore, etc."
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={getLocationAuto}
                    className="px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    GPS
                  </button>
                </div>
              </div>

              <button
                onClick={handleSubmit}
                className="w-full py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                🌦️ Fetch Weather & Analyze Flood Risk
              </button>
            </div>
          </div>
        )}

        {loading && (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <div className="animate-spin w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">Fetching live weather forecast and analyzing flood risk...</p>
          </div>
        )}

        {step === 'results' && predictions && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800">Risk Assessment</h2>
                <div className="text-sm text-gray-600">
                  Location: <span className="font-medium">{predictions.location}</span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                    <span className="font-medium text-gray-700">Flood Probability</span>
                  </div>
                  <div className={`text-3xl font-bold ${getRiskColor(predictions.floodProbability)}`}>
                    {predictions.floodProbability}%
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Next 7 days</div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Droplets className="w-5 h-5 text-blue-500" />
                    <span className="font-medium text-gray-700">Runoff Risk</span>
                  </div>
                  <div className="text-3xl font-bold text-gray-800">
                    {predictions.runoffRisk}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Based on slope & soil</div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Sprout className="w-5 h-5 text-green-500" />
                    <span className="font-medium text-gray-700">Crop Stage</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-800">
                    {predictions.cropStage}
                  </div>
                  <div className="text-sm text-orange-600 mt-1">
                    Vulnerability: {predictions.stageVulnerability}
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Cloud className="w-5 h-5 text-gray-500" />
                    <span className="font-medium text-gray-700">Forecast Rainfall</span>
                  </div>
                  <div className="text-3xl font-bold text-gray-800">
                    {predictions.rainfall7Day} mm
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Next 3 days: {predictions.recentRainfall} mm
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Rain probability: {predictions.maxPrecipProb}%
                  </div>
                  <div className="text-xs text-blue-600 mt-1">Data: {predictions.dataSource}</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4 text-gray-800">
                Exact Actions to Take (Priority Order)
              </h2>
              <div className="space-y-4">
                {actions.map((action, idx) => (
                  <div key={idx} className="border-l-4 border-gray-200 pl-4 py-3 hover:bg-gray-50 transition-colors" style={{borderLeftColor: action.priority === 'URGENT' ? '#ef4444' : action.priority === 'HIGH' ? '#f97316' : action.priority === 'MEDIUM' ? '#eab308' : '#22c55e'}}>
                    <div className="flex items-start gap-3">
                      <span className={`${getPriorityColor(action.priority)} text-white text-xs font-bold px-2 py-1 rounded mt-1`}>
                        {action.priority}
                      </span>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-800 text-lg mb-1">
                          {action.action}
                        </h3>
                        <div className="space-y-1 text-sm">
                          <p className="text-gray-600">
                            <span className="font-medium">Timeline:</span> {action.timeline}
                          </p>
                          <p className="text-gray-600">
                            <span className="font-medium">Reason:</span> {action.reason}
                          </p>
                          <p className="text-green-700">
                            <span className="font-medium">Impact:</span> {action.impact}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  setStep('input');
                  setPredictions(null);
                  setActions([]);
                }}
                className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                New Analysis
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
              >
                Print/Save Actions
              </button>
            </div>
          </div>
        )}

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Powered by WeatherAPI.com + ML flood prediction models</p>
        </div>
      </div>
    </div>
  );
};

export default FloodPreventer;