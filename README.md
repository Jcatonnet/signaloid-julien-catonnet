# Currency Converter Web Application

## Overview

This is a Vue.js web application that allows users to convert currencies and view the distribution of the converted target amount using the Signaloid API.

Due to time constraint, we have built a simple UI to allow user to perform simple actions and download distribution result. For real life scenario, we would display the distribution result directly through the UI.

We implemented a simple error handling and input checks that would need to be further enhanced for production.

Environment variables are not secured for review purpose.

## Project architecture

Simple architecture with separation of concerns

- src/: Contains the source code.
- components/: Vue components. Form component for user input and related logic
- services/: API service files. service file that handle signaloid API calls and business logic
- types/: TypeScript type definitions.
- public/: Static assets.
- .env: Environment variables file.
- vite.config.js: Vite configuration file.

## Features

- Convert currencies between specified pairs.
- Specify minimum and maximum conversion rates.
- View the distribution of the converted target amount.
- Error handling and validation for input fields.
- Uses Signaloid API for computational tasks.

## Prerequisites

- Node.js (v14 or higher recommended)
- npm (v6 or higher recommended) or yarn (v1 or higher recommended)

## Getting Started

### Clone the Repository

```bash
git clone https://github.com/Jcatonnet/signaloid-julien-catonnet/tree/main
```

### Install dependencies

using NPM

```bash
npm install
```

Or using Yarn

```bash
yarn install
```

### Run application

```bash
npm run dev
```

Or using Yarn

```bash
yarn dev
```

This will start the application on http://localhost:5173.

### Usage

- Open the application in your web browser at http://localhost:5173.
- Select the currency pair you want to convert.
- Enter the amount, minimum rate, and maximum rate.
- Click the "Convert" button to view the distribution result.
