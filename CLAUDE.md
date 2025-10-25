# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Dashboard Union is a business intelligence application for managing and analyzing automotive parts dealer performance data for "Groupement Union". Built with React 18 + TypeScript, it provides comprehensive analytics, client management, and commercial tracking capabilities.

**Core Purpose:** Visualize sales performance (CA - chiffre d'affaires) for members ("adhérents"), track supplier relationships, manage commercial territories, and provide RFA (remise forfait arrière - backend discount) calculations.

## Development Commands

### Essential Commands
```bash
npm start          # Start dev server (React Scripts)
npm run build      # Production build
npm test           # Run tests
```

### Database Scripts
Located in `/scripts` directory - Node.js scripts for Supabase operations:
```bash
node scripts/importToSupabase.js           # Import data to Supabase
node scripts/backupSupabaseData.js         # Backup Supabase data
node scripts/testSupabaseConnection.js     # Test connection
node scripts/setupClientNotes.js           # Setup client notes table
```

### TypeScript Setup Scripts
Located in `/src/scripts` - TypeScript scripts for database setup:
```bash
npx ts-node src/scripts/createTables.ts    # Create database tables
npx ts-node src/scripts/setupDatabase.ts   # Full database setup
```

## Architecture

### Data Flow Architecture

**Three-Layer Data Model:**
1. **`adherents` table** (Supabase): Raw sales data with columns: `codeUnion`, `raisonSociale`, `groupeClient`, `regionCommerciale`, `fournisseur`, `marque`, `famille`, `sousFamille`, `groupeFournisseur`, `annee` (2024/2025), `ca` (revenue)
2. **`clients` table** (Supabase): Client master data including contact info, coordinates, and `agent_union` (commercial assigned)
3. **Enriched `AdherentData`**: In-app data structure combining CA from `adherents` + `agent_union` from `clients`

**Data Enrichment Flow:**
- `fetchAdherentsData()` → loads CA data from `adherents` table
- `enrichAdherentsWithAgentUnion()` → joins with `clients.agent_union` field
- Result: Complete dataset with sales data + commercial assignments

### Key Architectural Patterns

**Platform System:**
- Multi-platform support: ACR, DCA, EXADIS, ALLIANCE
- Platform filtering via `PlatformContext` (`src/contexts/PlatformContext.tsx`)
- Data assignment: `assignPlatformToData()` in `src/utils/platformUtils.ts`
- User-based platform restrictions via `plateformesAutorisees` field

**Region System:**
- Regional filtering via `RegionContext` (`src/contexts/RegionContext.tsx`)
- Regions extracted from `adherents.regionCommerciale` field
- Functions: `extractUniqueRegions()`, `filterDataByRegion()`

**User & Auth System:**
- Dual authentication: Simple email/password + Google OAuth
- User context: `src/contexts/UserContext.tsx`
- Simple auth: `src/config/simple-auth.ts`
- Google OAuth: `src/services/googleAuthService.ts`
- User service (centralized): `src/services/userService.ts`
- Users stored in Supabase `users` table with roles: `admin`, `commercial`, `viewer`

**Connection Tracking System:**
- Daily connection tracking with gamification (points, streaks)
- Service: `src/services/connectionService.ts`
- Components: `AutoConnectionScore.tsx`, `AutoPodium.tsx`
- Tables: `user_connections`, `monthly_scores` (Supabase)

### Component Structure

**Main App Components:**
- `src/App.tsx`: Main application orchestrator with tab navigation
- `src/AppRouter.tsx`: React Router setup (routes: `/`, `/notes`, `/auth/callback`)
- `src/index.tsx`: Entry point with providers

**Key Modal Components:**
- `ClientDetailModal.tsx`: Comprehensive client view with supplier/brand performance
- `ClientEditModal.tsx`: Edit client information
- `FournisseurDetailModal.tsx`: Supplier detail view with client list
- `FamilleDetailModalLegacy.tsx`: Product family details
- `MarqueModal.tsx`: Brand details
- `CommercialDetailModal.tsx`: Commercial territory view

**Data Management:**
- `DataImport.tsx`: Excel/CSV import with column mapping
- `ExcelClientImport.tsx`: Client data import from Excel
- `DataBackup.tsx`: Data backup/export functionality
- `SupabaseDocumentUploader.tsx`: Document upload to Supabase storage

**Analysis Components:**
- `ClientsAnalysis.tsx`: Client performance analysis
- `TopFlopSection.tsx`: Top/Flop performers
- `GeographicMap.tsx`: Google Maps integration for client locations
- `RevenueChart.tsx`: Chart.js visualizations

**User Management:**
- `UserManagement.tsx`: Admin user CRUD
- `UserProfileModal.tsx`: User profile editor
- `UserPhotoUpload.tsx`: Avatar upload
- `PasswordManagement.tsx`: Password management

**RFA (Discount) System:**
- `RfaManager.tsx`: Configure RFA rules per client/supplier
- `RfaConfigurationModal.tsx`: RFA configuration modal
- `RfaTab.tsx`: RFA management tab

## Configuration & Environment

### Required Environment Variables

**Supabase:**
```
REACT_APP_SUPABASE_URL=https://ybzajzcwxcgoxtqsimol.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_anon_key
```

**Google Maps:**
```
REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_key
```

**Google OAuth:**
```
REACT_APP_GOOGLE_CLIENT_ID=your_client_id
REACT_APP_GOOGLE_CLIENT_SECRET=your_client_secret
```

**OpenAI (for chatbot):**
```
REACT_APP_OPENAI_API_KEY=your_openai_key
```

**Platform Detection:**
```
VERCEL=1  # For Vercel deployment
```

### Supabase Configuration

**Config Files:**
- `src/config/supabase.ts`: Main Supabase client and adherents data
- `src/config/supabase-clients.ts`: Clients table operations
- `src/config/supabase-clients-commercials.ts`: Commercials operations
- `src/config/supabase-users.ts`: Users and tasks operations
- `src/config/supabase-photos.ts`: Photo storage operations
- `src/config/supabase-likes.ts`: Likes system
- `src/config/supabase-views.ts`: Views tracking

**Key Functions:**
- `fetchAdherentsData()`: Paginated fetch (1000 records/page) from `adherents` table
- `enrichAdherentsWithAgentUnion()`: Join adherents with client.agent_union
- `enrichClientsWithCAData()`: Join clients with CA data from adherents

### Google Maps Integration

- Config: `src/config/googleMaps.ts`
- Service: `src/services/geocodingService.ts`
- Component: `src/components/GeographicMap.tsx`
- Map displays clients with coordinates from `clients.latitude/longitude`

## Database Schema

### Core Tables

**adherents:**
- Primary sales data table
- Columns: `codeUnion`, `raisonSociale`, `groupeClient`, `regionCommerciale`, `fournisseur`, `marque`, `famille`, `sousFamille`, `groupeFournisseur`, `annee` (2024/2025), `ca`
- One row per client-supplier-brand-family-year combination

**clients:**
- Client master data
- Key columns: `code_union` (unique), `nom_client`, `groupe`, `agent_union`, `adresse`, `latitude`, `longitude`, `statut`
- Contact fields: `contact_magasin`, `telephone`, `mail`, `siren_siret`

**users:**
- User accounts with roles (`admin`, `commercial`, `viewer`)
- Columns: `email`, `nom`, `prenom`, `roles[]`, `plateformesAutorisees[]`, `photo_url`, `isGoogleAuthenticated`

**commercials:**
- Commercial territory management
- Columns: `nom`, `email`, `region`, `clients[]` (array of code_union), `ca_total`, `ca_2024`, `ca_2025`, `progression`

**user_connections & monthly_scores:**
- Connection tracking and gamification system
- Track daily connections, points, streaks

**tasks:**
- Task management linked to clients/commercials
- Columns: `titre`, `description`, `statut`, `priorite`, `client_code_union`, `commercial_id`, `auteur`, `date_echeance`

## Important Development Notes

### Data Pagination
The `adherents` table can contain 10,000+ records. Always use pagination when fetching:
```typescript
// Example from supabase.ts
let page = 0;
const pageSize = 1000;
const offset = page * pageSize;
// Use .range(offset, offset + pageSize - 1) or manual offset
```

### Agent Union Enrichment
The `agentUnion` field is NOT in the `adherents` table. It comes from `clients.agent_union`:
1. Load adherents data
2. Call `enrichAdherentsWithAgentUnion()` to join
3. Use enriched data in app

### Multi-year CA Calculations
Sales data exists for both 2024 and 2025 (separate rows with `annee` field). When calculating totals:
- Filter by `annee: 2024` for 2024 CA
- Filter by `annee: 2025` for 2025 CA
- Calculate progression: `((ca2025 - ca2024) / ca2024) * 100`

### Platform Assignment Logic
Platform assignment happens at runtime via `assignPlatformToData()`:
- Uses `groupeClient` field to determine platform
- Mapping in `src/config/platforms.ts`
- Admin users see all platforms by default

### Type System
Main types in `src/types/index.ts`:
- `AdherentData`: Individual CA record with all dimensions
- `AdherentSummary`: Aggregated client-level summary
- `FournisseurPerformance`: Supplier-level aggregates
- `FamilleProduitPerformance`: Product family aggregates
- `CommercialPerformance`: Commercial territory aggregates

### Security Considerations
- **IMPORTANT**: `src/config/supabase.ts` contains hardcoded Supabase credentials (service role key). This should be moved to environment variables before production.
- Default login credentials are in `SECURITY_URGENT.md` - these MUST be changed for production.
- Authentication system uses both simple auth and Google OAuth.

## Deployment

### Vercel Deployment
- Config: `vercel.json` (SPA rewrites)
- Vercel environment variables documented in `VERCEL_ENV_SETUP.md`
- Build command: `npm run build`
- Output directory: `build/`

### Pre-deployment Checklist
1. Set all environment variables in Vercel dashboard
2. Change default authentication credentials
3. Review `SECURITY_URGENT.md` warnings
4. Test Google Maps API key (documented in `GOOGLE_MAPS_SETUP.md`)
5. Verify Supabase connection and RLS policies

## Styling & UI

- **Tailwind CSS**: Configured in `tailwind.config.js`
- **Custom CSS**:
  - `src/styles/animations.css`: Animation utilities
  - `src/styles/colors.css`: Color system
  - `src/styles/onboarding.css`: Onboarding styles
- **Design tokens**: Variables in CSS files for consistency
- **Icons**: `lucide-react` library

## Third-party Integrations

- **Supabase**: Database + storage + auth
- **Google Maps API**: Client geolocation
- **Google OAuth**: Alternative authentication
- **OpenAI API**: Chatbot functionality (`FloatingChatbot.tsx`)
- **Chart.js**: Data visualizations
- **jsPDF**: PDF export functionality
- **Papa Parse**: CSV parsing
- **XLSX**: Excel import/export
