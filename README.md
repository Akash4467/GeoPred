# GeoPred
# GeoPred

GeoPred is an innovative web application that combines advanced machine learning models with an interactive 3D globe, allowing users to explore the future population and GDP predictions of different countries. By clicking on any country on the globe, users can access real-time data and predictions about key economic and demographic metrics, including population growth and GDP forecasts for the next 3 to 5 years.

## Features

- **3D Interactive Globe:** 
  - A visually stunning, interactive 3D globe where users can navigate around the world and click on any country.
  
- **Click-to-Predict:**
  - When a user clicks on a country, the machine learning model predicts its population and GDP for the next 3 to 5 years.
  
- **Machine Learning Integration:** 
  - The project uses machine learning algorithms to forecast economic and demographic trends based on historical and current data.
  
- **Real-Time Data:** 
  - GeoPred continuously updates predictions with real-time data to ensure the accuracy of population and GDP projections.
  
- **Data Visualization:** 
  - Clear and concise visualizations (charts/graphs) of predictions to make data interpretation easier.

- **User-Friendly Interface:** 
  - Simple and intuitive interface for smooth interaction with the globe and predictions.

## How It Works

1. **User Interaction:**
   - The user is presented with a 3D globe and can click on any country.
   
2. **Data Handling:**
   - Upon selection, the system fetches data from the integrated ML models and displays predictions for population and GDP.
   
3. **Prediction Model:**
   - The machine learning model analyzes historical data and trends to predict future population and GDP values.
   
4. **Data Visualization:**
   - The predictions are displayed in easy-to-understand formats like graphs, making it simple to compare countries.

## Technologies Used

- **Three.js**: For the 3D globe visualization.
- **Machine Learning Algorithms**: Such as regression models, neural networks, etc., to predict GDP and population.
- **Backend Technologies**: Python (Flask/Django) for handling predictions and data processing.
- **Frontend Technologies**: HTML, CSS, and JavaScript for creating the interactive interface.

## Installation

To run this project locally, follow these steps:

1. Clone the repository:

   ```bash
   git clone https://github.com/YourUsername/GeoPred.git


Navigate to the project directory:
cd GeoPred

Install the required dependencies:

For the backend (Flask/Django), run:
pip install -r requirements.txt
For the frontend, install the necessary packages (e.g., Three.js, Webpack, etc.):
npm install

Run the server:
Start the backend server:
python app.py

