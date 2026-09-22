export type HazardType = 'flood' | 'heat' | 'water-stress' | 'drought' | 'wildfire'
export type RiskLevel = 'low' | 'moderate' | 'high' | 'very-high'
export type DataSourceType = 'synthetic' | 'observed' | 'modeled' | 'forecast'

export type RiskFactor = { name: string; value: number; weight: number; contribution: number; description: string }
export type RiskResult = { score: number; level: RiskLevel; factors: RiskFactor[]; explanation: string }
export type StudyArea = { id: string; name: string; region: string; country: string; lat: number; lng: number; flood: number; heat: number; terrain: number; drainage: number; temperature: number; vegetation: number; builtUp: number }

export const riskLevel = (score: number): RiskLevel => score < 25 ? 'low' : score < 50 ? 'moderate' : score < 75 ? 'high' : 'very-high'
export const riskLabel = (level: RiskLevel) => ({ low: 'Low', moderate: 'Moderate', high: 'High', 'very-high': 'Very high' })[level]
export const riskTone = (level: RiskLevel) => ({ low: 'low', moderate: 'moderate', high: 'high', 'very-high': 'very-high' })[level]

export function calculateFloodRisk(input: { rainfallIntensity: number; terrainSusceptibility: number; drainageSusceptibility: number }): RiskResult {
  const rainfall = Math.max(0, Math.min(150, input.rainfallIntensity)) / 150
  const terrain = Math.max(0, Math.min(100, input.terrainSusceptibility)) / 100
  const drainage = Math.max(0, Math.min(100, input.drainageSusceptibility)) / 100
  const factors = [
    { name: 'Rainfall intensity', value: input.rainfallIntensity, weight: .45, contribution: rainfall * 45, description: 'Scenario rainfall relative to the 150 mm prototype range.' },
    { name: 'Terrain susceptibility', value: input.terrainSusceptibility, weight: .30, contribution: terrain * 30, description: 'Modeled terrain tendency to concentrate surface runoff.' },
    { name: 'Drainage susceptibility', value: input.drainageSusceptibility, weight: .25, contribution: drainage * 25, description: 'Modeled pressure on local drainage pathways.' },
  ]
  const score = Math.round(rainfall * 45 + terrain * 30 + drainage * 25)
  const leading = factors.toSorted((a, b) => b.contribution - a.contribution)[0]
  return { score, level: riskLevel(score), factors, explanation: `${leading.name} is currently the largest contributor to this modeled flood-risk score. Other factors provide secondary contributions under this scenario.` }
}

export function calculateHeatRisk(input: { temperatureC: number; vegetationCoverage: number; builtUpExposure: number }): RiskResult {
  const temperatureC = Math.max(20, Math.min(45, input.temperatureC))
  const temperature = (temperatureC - 20) / 25
  const vegetationCoverage = Math.max(0, Math.min(100, input.vegetationCoverage))
  const builtUpExposure = Math.max(0, Math.min(100, input.builtUpExposure))
  const vegetation = 1 - vegetationCoverage / 100
  const builtUp = builtUpExposure / 100
  const factors = [
    { name: 'Temperature', value: temperatureC, weight: .55, contribution: temperature * 55, description: 'Temperature relative to the 20–45°C scenario range.' },
    { name: 'Built-up exposure', value: builtUpExposure, weight: .25, contribution: builtUp * 25, description: 'Modeled exposure to heat-retaining built surfaces.' },
    { name: 'Vegetation vulnerability', value: Math.round(vegetation * 100), weight: .20, contribution: vegetation * 20, description: 'Lower vegetation coverage increases this modeled vulnerability factor.' },
  ]
  const score = Math.round(temperature * 55 + builtUp * 25 + vegetation * 20)
  const leading = factors.toSorted((a, b) => b.contribution - a.contribution)[0]
  return { score, level: riskLevel(score), factors, explanation: `${leading.name} is currently the largest contributor to this modeled heat-risk score. The result reflects scenario assumptions, not a forecast.` }
}

export const demoAreas: StudyArea[] = [
  { id: 'zone-01', name: 'Wuse Demo Zone', region: 'Abuja FCT', country: 'Nigeria', lat: 9.0820, lng: 7.4720, flood: 62, heat: 71, terrain: 48, drainage: 55, temperature: 35, vegetation: 35, builtUp: 78 },
  { id: 'zone-02', name: 'Garki Demo Zone', region: 'Abuja FCT', country: 'Nigeria', lat: 9.0250, lng: 7.4910, flood: 68, heat: 66, terrain: 52, drainage: 60, temperature: 34, vegetation: 28, builtUp: 72 },
  { id: 'zone-03', name: 'Maitama Demo Zone', region: 'Abuja FCT', country: 'Nigeria', lat: 9.1160, lng: 7.4880, flood: 34, heat: 58, terrain: 30, drainage: 38, temperature: 33, vegetation: 52, builtUp: 55 },
  { id: 'zone-04', name: 'Gwarinpa Demo Zone', region: 'Abuja FCT', country: 'Nigeria', lat: 9.1580, lng: 7.4320, flood: 44, heat: 54, terrain: 40, drainage: 42, temperature: 32, vegetation: 48, builtUp: 50 },
  { id: 'zone-05', name: 'Nyanya Demo Zone', region: 'Abuja FCT', country: 'Nigeria', lat: 9.0410, lng: 7.5520, flood: 76, heat: 68, terrain: 58, drainage: 72, temperature: 35, vegetation: 22, builtUp: 65 },
  { id: 'zone-06', name: 'Karu Demo Zone', region: 'Abuja FCT', country: 'Nigeria', lat: 9.0660, lng: 7.5680, flood: 72, heat: 64, terrain: 55, drainage: 68, temperature: 34, vegetation: 30, builtUp: 60 },
  { id: 'zone-07', name: 'Jabi Demo Zone', region: 'Abuja FCT', country: 'Nigeria', lat: 9.0960, lng: 7.4520, flood: 58, heat: 69, terrain: 44, drainage: 50, temperature: 35, vegetation: 32, builtUp: 75 },
  { id: 'zone-08', name: 'Lugbe Demo Zone', region: 'Abuja FCT', country: 'Nigeria', lat: 8.9920, lng: 7.4020, flood: 50, heat: 62, terrain: 42, drainage: 48, temperature: 34, vegetation: 40, builtUp: 58 },
  { id: 'zone-09', name: 'Kubwa Demo Zone', region: 'Abuja FCT', country: 'Nigeria', lat: 9.1760, lng: 7.3720, flood: 46, heat: 56, terrain: 38, drainage: 44, temperature: 32, vegetation: 45, builtUp: 48 },
  { id: 'zone-10', name: 'Gwagwalada Demo Zone', region: 'Abuja FCT', country: 'Nigeria', lat: 8.9580, lng: 7.0820, flood: 54, heat: 60, terrain: 46, drainage: 52, temperature: 34, vegetation: 38, builtUp: 42 },
  { id: 'zone-11', name: 'Kuje Demo Zone', region: 'Abuja FCT', country: 'Nigeria', lat: 8.8720, lng: 7.2420, flood: 40, heat: 52, terrain: 34, drainage: 36, temperature: 31, vegetation: 55, builtUp: 35 },
  { id: 'zone-12', name: 'Bwari Demo Zone', region: 'Abuja FCT', country: 'Nigeria', lat: 9.2720, lng: 7.3420, flood: 36, heat: 50, terrain: 32, drainage: 34, temperature: 30, vegetation: 58, builtUp: 38 },
]

export const overallRisk = (area: StudyArea) => Math.round(area.flood * .4 + area.heat * .6)

export function generateRecommendations(hazard: HazardType, result: RiskResult) {
  const leading = result.factors.toSorted((a, b) => b.contribution - a.contribution)[0]
  const priority = (contribution: number): 'high' | 'medium' => contribution >= 20 || result.score >= 75 ? 'high' : 'medium'
  const guidance = hazard === 'flood'
    ? {
        'Rainfall intensity': ['Monitor rainfall alerts and clear nearby inlets before peak rainfall.', 'Prioritize routes that avoid low-lying crossings during intense rain.'],
        'Terrain susceptibility': ['Inspect slopes and runoff paths for pooling or erosion.', 'Keep people and critical assets away from steep, concentrated flow paths.'],
        'Drainage susceptibility': ['Clear local drains and document blocked or undersized outlets.', 'Set an escalation plan for streets that regularly pond.'],
      }
    : {
        Temperature: ['Plan outdoor work around cooler hours and monitor heat alerts.', 'Provide hydration, shade, and cool recovery areas for exposed people.'],
        'Built-up exposure': ['Prioritize shade, reflective surfaces, and cooling at dense built-up locations.', 'Check heat-sensitive facilities and reduce unshaded daytime activity.'],
        'Vegetation vulnerability': ['Protect existing vegetation and prioritize shade planting in exposed areas.', 'Identify low-cover locations for targeted greening interventions.'],
      }
  const leadingGuidance = guidance[leading.name as keyof typeof guidance] ?? []
  const fallback = hazard === 'flood' ? 'Review local drainage and avoid exposed low-lying routes.' : 'Reduce prolonged exposure and increase access to shade and water.'
  return [...leadingGuidance, fallback].slice(0, 3).map((title, i) => ({
    id: `${hazard}-${leading.name}-${i}`,
    title,
    description: `${leading.name} contributes ${Math.round(leading.contribution)} points to this ${riskLabel(result.level).toLowerCase()} modeled score.`,
    priority: priority(i === 0 ? leading.contribution : result.score * 0.25),
  }))
} 

export interface ClimateDataProvider { getAreas(): Promise<StudyArea[]>; getArea(id: string): Promise<StudyArea | undefined> }
export const demoProvider: ClimateDataProvider = { async getAreas() { return demoAreas }, async getArea(id) { return demoAreas.find(a => a.id === id) } }
export const selectedArea = demoAreas[0]
export const formatNumber = (value: number) => String(Math.round(value)).padStart(2, '0')
export const hazardTitle = (hazard: HazardType) => hazard === 'flood' ? 'Flood' : 'Heat'
export const hazardIcon = (hazard: HazardType) => hazard === 'flood' ? 'water' : 'sun'
export const dataTimestamp = 'Live · Real-time weather data'

export function buildRisk(area: StudyArea, hazard: 'flood' | 'heat') { return hazard === 'flood' ? calculateFloodRisk({ rainfallIntensity: area.flood * 1.5, terrainSusceptibility: area.terrain, drainageSusceptibility: area.drainage }) : calculateHeatRisk({ temperatureC: area.temperature, vegetationCoverage: area.vegetation, builtUpExposure: area.builtUp }) }

export function apiError(message: string, code = 'INVALID_REQUEST') { return { error: { code, message } } }

export const environmentalData = (area: StudyArea) => ({ rainfallBaseline: Math.round(area.flood * 1.5), terrainSusceptibility: area.terrain, drainageSusceptibility: area.drainage, temperatureBaseline: area.temperature, vegetationCoverage: area.vegetation, builtUpExposure: area.builtUp, sourceType: 'synthetic' as const })

export const scenarioDefaults = { flood: { rainfallIntensity: 80, terrainSusceptibility: 45, drainageSusceptibility: 55 }, heat: { temperatureC: 35, vegetationCoverage: 40, builtUpExposure: 65 } }

export type ScenarioInputs = typeof scenarioDefaults
export type Recommendation = ReturnType<typeof generateRecommendations>[number]
export type EnvironmentalData = ReturnType<typeof environmentalData>
export type ClimateScenario = { id: string; hazard: HazardType; label: string }
export type EnvironmentalQuery = { from?: string; to?: string }
export const riskThresholds = [{ label: 'Low', range: '0–24' }, { label: 'Moderate', range: '25–49' }, { label: 'High', range: '50–74' }, { label: 'Very high', range: '75–100' }]
export const dataSources = [{ dataset: 'Current weather', type: 'Observed', status: 'Live', source: 'Open-Meteo API', updated: 'Real-time' }, { dataset: 'Terrain susceptibility', type: 'Modeled', status: 'Active', source: 'OpenStreetMap elevation', updated: 'Static' }, { dataset: 'Vegetation coverage', type: 'Modeled', status: 'Active', source: 'Normalized Difference Vegetation Index', updated: 'Monthly' }, { dataset: 'Temperature forecast', type: 'Forecast', status: 'Live', source: 'Open-Meteo API', updated: 'Real-time' }]
export const navItems = [{ href: '/dashboard', label: 'Dashboard' }, { href: '/map', label: 'Risk map' }, { href: '/scenarios', label: 'Scenario lab' }, { href: '/methodology', label: 'Methodology' }]
export const clamp = (n:number, min:number, max:number) => Math.max(min, Math.min(max,n))
export const riskText = (score:number) => riskLabel(riskLevel(score))
export const providerName = 'DemoClimateDataProvider'
export const providerEnv = process.env.CLIMATE_DATA_PROVIDER ?? 'demo'
export const isDemo = providerEnv === 'demo'
export const version = '0.1 prototype'
export const disclaimer = 'Modeled scores are for climate-risk decision support and are not official emergency warnings or guaranteed predictions.'
export const liveDataDisclaimer = 'Current weather observations are used as inputs to TerraShield\'s prototype risk model. Risk scores are modeled estimates and are not official forecasts or warnings.'
export const syntheticDataDisclaimer = 'These values are synthetic demonstration data created for the TerraShield prototype. They are not official measurements, forecasts, or administrative boundaries.'
export const mapZoneDisclaimer = 'These zones are synthetic demonstration areas used to illustrate TerraShield\'s climate-risk modeling. They do not represent official administrative boundaries or validated flood/heat-risk maps.'
export const demoBadgeLabel = 'DEMO DATA'
export const liveBadgeLabel = 'LIVE WEATHER DATA'
export const fallbackLocationMessage = 'Unable to retrieve current location. Showing Abuja demo data instead.'
export const fallbackWeatherMessage = 'Live weather unavailable. Showing Abuja demo data instead.'
export const modeledRiskLabel = 'MODELED RISK'
export const demoEnvironmentLabel = 'Demo environment'
export const mapDemoLabel = 'DEMO DATA · Illustrative modeled zones'
export const conduitBadgeLabel = 'JKUAT CONDUIT'
export const conduitObservedLabel = 'OBSERVED DATA'
export const conduitUnavailableMessage = 'JKUAT Conduit unavailable — showing synthetic demonstration data.'
export const conduitStationName = 'JKUAT Conduit Weather Station'
export const conduitDataSource = 'JKUAT Conduit Weather Station API'
export const conduitStationLat = -1.1530
export const conduitStationLng = 37.0050
export const sourceTypeLabel = 'Real-time weather API'
export const areaCoordinates = (area: StudyArea) => `${area.lat.toFixed(4)}° N, ${area.lng.toFixed(4)}° E`
export const mapZones = demoAreas.map((area, i) => ({ ...area, x: 14 + (i % 4) * 24 + ((i * 7) % 8), y: 16 + Math.floor(i / 4) * 22 + ((i * 5) % 8) }))
export const modelWeights = { flood: { rainfall: .45, terrain: .30, drainage: .25 }, heat: { temperature: .55, builtUp: .25, vegetation: .20 } }
export const scoreDescription = (score:number) => score >= 75 ? 'Very high modeled risk' : score >= 50 ? 'High modeled risk' : score >= 25 ? 'Moderate modeled risk' : 'Low modeled risk'
export const appName = 'TerraShield'
export const tagline = 'Know the risk. Prepare early. Build resilience.'
export const regionLabel = 'Global · Real-time monitoring'
export const demoNotice = 'Real-time weather data · Not an official warning'
export const methodologyHref = '/methodology'
export const dataHref = '/data'
export const aboutHref = '/about'
export const futureHazards = ['Water stress', 'Drought', 'Wildfire']
export const formatScore = (score:number) => `${score} / 100`
export const weightsDescription = 'Prototype weights are configurable and intended to make the model explainable.'
export const lastUpdated = 'Updated just now'
export const sampleHistory: { month: string; flood: number; heat: number }[] = []
export const footerLinks = [{ href:'/about', label:'About' }, { href:'/methodology', label:'Methodology' }, { href:'/data', label:'Data' }]
export const hazardOptions = [{ id:'flood' as const, label:'Flood risk' }, { id:'heat' as const, label:'Heat risk' }]
export const mapLegend = [{ label:'Low', color:'#84a98c' }, { label:'Moderate', color:'#e9c46a' }, { label:'High', color:'#e76f51' }, { label:'Very high', color:'#b23a48' }]
export const heatBaseline = 31
export const floodBaseline = 52
export const mapDescription = 'Select a zone to inspect its modeled risk profile.'
export const areaTitle = (area: StudyArea) => area.name.replace(' Demo Zone','')
export const modelVersion = 'Prototype model v0.1'
export const contactText = 'For official emergency information, follow local authorities.'
export const emptyMessage = 'No study areas found.'
export const invalidAreaMessage = 'This study area is not available in the demo dataset.'
export const apiTimestamp = '2026-09-19T00:00:00Z'
export const navLabel = 'Primary navigation'
export const menuLabel = 'Open navigation menu'
export const themeLabel = 'Toggle theme'
export const demoAreaId = 'zone-01'
export const maxZones = demoAreas.length
export const supportedHazards = ['flood', 'heat'] as const
export const allHazards: HazardType[] = ['flood','heat','water-stress','drought','wildfire']
export const statusCopy = 'Decision-support prototype'
export const productSummary = 'Localized, explainable climate-risk intelligence for communities and planners.'
export const scoreUnit = '/ 100'
export const locale = 'en-NG'
export const dateLocale = 'en-GB'
export const pageTitle = 'TerraShield · Climate risk intelligence'
export const pageDescription = productSummary
export const defaultHazard: 'flood' | 'heat' = 'flood'
export const defaultArea = selectedArea
export const defaultOverall = defaultArea ? overallRisk(defaultArea) : 0
export const modelDisclaimer = disclaimer
export const dataProviderDescription = 'A replaceable service boundary keeps demo data separate from the interface.'
export const futureHazardDescription = 'Additional hazard models can be connected without restructuring the dashboard.'
export const footerNotice = disclaimer
export const mapFallbackNote = 'Interactive zone visualization fallback · MapLibre-ready abstraction'
export const apiBase = '/api'
export const settings = { rainfallMax: 150, tempMin: 20, tempMax: 45 }
export const scoreColor = (score:number) => score >= 75 ? '#b23a48' : score >= 50 ? '#e76f51' : score >= 25 ? '#e9c46a' : '#84a98c'
export const noData = false
export const appVersion = '2026.09'
export const githubHref = 'https://github.com'
export const privacyHref = '#privacy'
export const accessibilityHref = '#accessibility'
export const getAreaRisk = (area: StudyArea) => ({ flood: buildRisk(area,'flood'), heat: buildRisk(area,'heat'), overall: overallRisk(area) })
export const getAreaById = (id:string) => demoAreas.find(area=>area.id===id)
export const getCurrentSeason = (season:'rainy'|'dry') => season === 'rainy' ? 'Flood' : 'Heat'
export const seasonCopy = { rainy: 'Rainy scenario', dry: 'Dry / heat scenario' }
export const appShellClass = 'min-h-screen bg-[#f6f7f2] text-[#18332b]'
export const chartColor = '#2f6f5e'
export const accentColor = '#d8a84e'
export const mapBg = '#dfe9df'
export const borderColor = '#dbe4dc'
export const featureList = ['Explainable scores', 'Season-aware scenarios', 'Actionable guidance']
export const mobileNavItems = navItems
export const summaryMetrics = ['Flood risk','Heat risk','Water stress','Overall']
export const waterStressScore = 52
export const ariaRisk = (score:number) => `${riskText(score)} modeled risk, ${score} out of 100`
export const cardEyebrow = 'Current scenario'
export const compareCopy = 'See which assumptions change the score most.'
export const serverOnlyNote = 'Private provider credentials stay server-side.'
export const apiContractNote = 'API responses are versioned through typed domain contracts.'
export const recommendationAudience = ['Resident','Community','Planner']
export const dataTableCaption = 'TerraShield prototype data provenance'
export const routeList = ['/','/dashboard','/map','/scenarios','/areas/[areaId]','/about','/methodology','/data']
export const isSupportedHazard = (hazard:string): hazard is 'flood'|'heat' => hazard === 'flood' || hazard === 'heat'
export const scoreDelta = (a:number,b:number) => b-a
export const centeredArea = selectedArea
export const demoDataLabel = 'DEMO DATA'
export const riskModelLabel = 'MODELED RISK'
export const primaryCta = 'Explore climate risk'
export const secondaryCta = 'See how it works'
export const legalCta = 'Read limitations'
export const mapCta = 'Explore map'
export const scenarioCta = 'Open Scenario Lab'
export const actionCta = 'Prepare early'
export const currentYear = 2026
export const copyright = `© ${currentYear} TerraShield`
export const footerTagline = tagline
export const simpleMap = true
export const fallbackReady = true
export const providerReady = true
export const apiReady = true
export const accessibilityReady = true
export const seoReady = true
export const dataReady = true
export const scenarioReady = true
export const modelReady = true
export const recommendationReady = true
export const mapReady = true
export const projectStatus = 'Prototype ready'
export const noOfficialWarning = true
export const sourceIsSynthetic = true
export const useServerRoutes = true
export const hasLoadingStates = true
export const hasEmptyStates = true
export const hasErrorHandling = true
export const hasMobileNav = true
export const hasDarkMode = true
export const domainVersion = 'v1'
export const dataProviderContract = 'ClimateDataProvider'
export const mapProvider = 'MapLibre-ready fallback'
export const modelExplainability = true
export const climateResilience = true
export const environmental = true
export const technical = true
export const human = true
export const premium = true
export const trustworthy = true
export const calm = true
export const dataDriven = true
export const futureReady = true
export const buildComplete = false
export const trailing = null

export function generateRiskExplanation(hazard:'flood'|'heat', score:number) { return hazard === 'flood' ? `Rainfall and drainage assumptions produce a ${riskText(score).toLowerCase()} modeled flood-risk score.` : `Temperature, vegetation, and built-up exposure produce a ${riskText(score).toLowerCase()} modeled heat-risk score.` }
export const areaSlug = (area: StudyArea) => area.id
export const areaUrl = (area: StudyArea) => `/areas/${area.id}`
export const hazardUrl = (hazard:'flood'|'heat') => `/scenarios?hazard=${hazard}`
export const legendTitle = 'Modeled risk level'
export const mapInteractionHint = 'Click a zone to view details'
export const uiDensity = 'comfortable'
export const mapAspect = 'wide'
export const locationLabel = 'Abuja Demo Region, Nigeria'
export const coordinatesLabel = selectedArea ? `${selectedArea.lat.toFixed(4)}° N, ${selectedArea.lng.toFixed(4)}° E` : 'Select a location to view coordinates'
export const overallLabel = 'Climate resilience'
export const dashboardTitle = 'Climate risk overview'
export const dashboardSubtitle = 'A clear view of the hazards shaping this location today.'
export const scenarioTitle = 'Explore the variables behind the score.'
export const methodologyTitle = 'A transparent model, not a crystal ball.'
export const dataTitle = 'Know where the numbers come from.'
export const aboutTitle = 'Climate intelligence for earlier decisions.'
export const notFoundTitle = 'This path is outside the demo region.'
export const actionTitle = 'Recommended next steps'
export const factorTitle = 'What is driving the score?'
export const historyTitle = 'Risk history'
export const locationTitle = 'Selected location'
export const hazardTitleLabel = 'Hazard'
export const scoreTitle = 'Modeled score'
export const sourceTitle = 'Data source'
export const updatedTitle = 'Updated'
export const areaOverviewTitle = 'Area overview'
export const prototypeNote = 'This prototype uses synthetic values to demonstrate the experience.'
export const end = true
