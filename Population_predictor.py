from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
from pmdarima import auto_arima

app = Flask(__name__)
CORS(app)

# Load the population and GDP datasets
population_file_path = 'Population_Data.csv'  # Update with your dataset path
gdp_file_path = 'GDP_Data.csv'  # Update with your dataset path
population_data = pd.read_csv(population_file_path)
gdp_data = pd.read_csv(gdp_file_path)

def preprocess_single_country(data):
    data = data.replace("..", None)
    data = pd.to_numeric(data, errors='coerce')
    data = data.interpolate(method='linear')
    data = data.ffill().bfill()
    return data

def format_data_for_arima(data, country_name, value_column):
    country_data = data[data['Country Name'] == country_name].iloc[:, 4:].T
    country_data.columns = [value_column]
    
    # Extract year from the index and convert it to datetime
    country_data.index = pd.to_numeric(country_data.index.str.extract(r'(\d+)')[0])
    country_data.index = pd.to_datetime(country_data.index, format='%Y')

    # Ensure that the index is datetime and sorted
    country_data = country_data.sort_index()

    # Check the index type to debug
    print(f"Index type for {country_name}: {type(country_data.index)}")

    return country_data[value_column]

def split_train_test(data, split_year):
    split_date = pd.to_datetime(f'{split_year}-01-01')
    train_data = data[data.index <= split_date]
    test_data = data[data.index > split_date]
    return train_data, test_data

def fit_arima_models(population_series, gdp_series):
    # Fit population model
    population_model = auto_arima(population_series, seasonal=False, stepwise=True, trace=False)
    population_model = population_model.fit(population_series)  # Fit the model
    
    # Fit GDP model
    gdp_model = auto_arima(gdp_series, seasonal=True, stepwise=True, trace=False)
    gdp_model = gdp_model.fit(gdp_series)  # Fit the model
    
    return population_model, gdp_model

def make_predictions(fitted_model, steps=5, start_date=None):
    forecast = fitted_model.predict(n_periods=steps, start=start_date)
    
    # Handle NaN values if predictions return them
    forecast = np.nan_to_num(forecast, nan=0)  # Replace NaNs with 0 or a custom value
    return forecast


@app.route('/predict', methods=['POST'])
def predict():
    data = request.json
    print("Received Data:", data)  # Log the incoming request data
    country = data.get('country')

    # Validate input
    if not country:
        return jsonify({'error': 'Country name is required'}), 400
       
    country_name = data['country']
    print("Country name:", country_name)  # Debugging

    try:
        # Normalize country names (convert to lowercase)
        country_normalized = country.strip().lower()

        # Handle different variations of country names
        country_mapping = {
            'usa': 'United States',
            'united states': 'United States',
            'us': 'United States',
            'u.s.': 'United States',
            'united states of america': 'United States'
        }

        # Replace with standardized country name if needed
        country_standardized = country_mapping.get(country_normalized, country)

        # Check if the country exists in the dataset
        if country_standardized not in population_data['Country Name'].values:
            return jsonify({'error': f'No data found for country: {country_standardized}'}), 400

        # Prepare data for ARIMA
        country_population_data = format_data_for_arima(population_data, country_standardized, 'Population')
        country_gdp_data = format_data_for_arima(gdp_data, country_standardized, 'GDP')
        country_gdp_data = preprocess_single_country(country_gdp_data)

        # Train-test split
        train_population, _ = split_train_test(country_population_data, 2018)
        train_gdp, _ = split_train_test(country_gdp_data, 2020)

        # Fit ARIMA models
        population_model, gdp_model = fit_arima_models(train_population, train_gdp)

        # Make predictions
        pop_forecast = make_predictions(population_model, steps=5)
        gdp_forecast = make_predictions(gdp_model, steps=3)

        # Debugging: print population forecast to verify it's calculated correctly
        print("Population Forecast:", pop_forecast)

        # Format predictions for population and GDP
        forecast_index_population = pd.date_range(start='2025', periods=5, freq='YE')
        pop_forecast_df = pd.DataFrame(pop_forecast, columns=['Predicted Population'])
        pop_forecast_df['Year'] = forecast_index_population.year

        forecast_index_gdp = pd.date_range(start='2025', periods=3, freq='YE')
        gdp_forecast_df = pd.DataFrame(gdp_forecast, columns=['Predicted GDP'])
        gdp_forecast_df['Year'] = forecast_index_gdp.year

        # Round the predictions to 2 decimal places
        pop_forecast_df['Predicted Population'] = pop_forecast_df['Predicted Population'].round(2)
        gdp_forecast_df['Predicted GDP'] = gdp_forecast_df['Predicted GDP'].round(2)

        # Debugging: print formatted forecast data
        print("Population Forecast DataFrame:\n", pop_forecast_df)
        print("GDP Forecast DataFrame:\n", gdp_forecast_df)

        # Return both population and GDP forecasts
        return jsonify({
            'population_forecast': pop_forecast_df.to_dict(orient='records'),
            'gdp_forecast': gdp_forecast_df.to_dict(orient='records')
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True)
