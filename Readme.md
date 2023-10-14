# Controlling Fronius Inverter Batterie with ioBroker

This project enables the control of the Fronius inverter and the utilization of Awattar electricity prices to manage the home battery based on electricity prices and other factors. The code runs under ioBroker.

## Prerequisites

To successfully use this project, the following prerequisites must be met:

- ioBroker: Ensure that ioBroker is installed and set up on your system.

- **Inverter Adapter:** The inverter adapter must be installed in ioBroker to access the Fronius inverter.

- **Wallbox Adapter:** The wallbox adapter must be installed in ioBroker to obtain information about electric vehicle charging.

## Usage

1. Open the ioBroker interface.

2. Create a new JavaScript instance or script.

3. Copy the contents of the `charge.js` file and paste it into your ioBroker instance.

4. Save and activate the script.

5. Monitor the script execution through the ioBroker interface.

## Control Logic

The control logic in this project consists of two main parts:

1. **Stopping Battery Discharge When Charging the Car:** The control logic ensures that the home battery is not discharged when the electric car is being charged.

2. **Using Awattar Electricity Prices for Charging and Discharging the Battery:** The control logic uses Awattar electricity prices to determine when the battery should be charged or discharged. The logic also takes into account weather conditions and the current time.

## License

This project is licensed under the MIT license. For more information, see the [License file](LICENSE).
