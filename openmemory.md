# OpenMemory Guide

This guide tracks the accumulated understanding of the **AfyaNexus_Athlete** project.

## Overview
AfyaNexus is a centralized athlete management system that integrates training logs, recovery data, nutrition tracking, and wearable device data. It features role-based portals for Athletes, Coaches, and Nutritionists and includes a machine learning engine for injury risk prediction.

## Architecture
The system follows a 5-layer architecture:
- **Frontend**: Next.js 15 (App Router) with TypeScript and Tailwind CSS.
- **Backend**: Node.js Express.js API.
- **ML Service**: Python Flask service with scikit-learn for injury risk prediction.
- **Database**: PostgreSQL hosted on Supabase.
- **Mobile/Wearable**: Android Health Connect bridge and T70 smartwatch integration.

## User Defined Namespaces
- **frontend**: Next.js application logic, components, and hooks.
- **backend**: Express API routes, controllers, and services.
- **ml**: Python ML service and model inference logic.
- **android**: Android bridge for Health Connect data.

## Key Components
- `client/app/`: Next.js App Router structure with role-based dashboard routes.
- `server/src/controllers/`: Core business logic for auth, athletes, coaches, and nutritionists.
- `ml/app.py`: Flask application serving predictions (GradientBoosting or rule-based fallback).
- `server/src/services/predictionService.js`: Integration point between the backend and ML service.

## Patterns
- **Authentication**: JWT-based auth with bcrypt hashing.
- **Data Flow**: Athletes log data -> Server -> ML Service -> Risk Score -> Supabase.
- **Styling**: Tailwind CSS with Framer Motion for animations.
- **Database Access**: `@supabase/supabase-js` for database and storage.

## Recent Changes
- AfyaNexus v1.0 released with full module set and UI redesign.
- ML engine upgraded to GradientBoosting model.
- Vercel deployment configurations optimized.
