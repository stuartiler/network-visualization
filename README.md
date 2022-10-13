# Economic Production Networks Visualization

This repository contains code for an interactive production networks visualization built with [D3.js v7](https://d3js.org/). A live version of this visualization is available online at [stuartiler.com](https://stuartiler.com/production_network).

The visualization is composed of four core files:

* production_network.html,
* production_network.css,
* production_network.js, and
* production_network.json.

The first three files are the visualization itself while the last file contains the data. The data represent the U.S. economic production network in 2015 at the level of 3-digit NAICS industries.

The data file can be recreated by executing the Python file "import_io_data.py," which takes the input data file "use_of_commodities_by_industries_2015.xls" and produces the output "production_network.json." The data in "use_of_commodities_by_industries_2015.xls" is publicly available on the website of the [U.S. Bureau of Economic Analysis](https://www.bea.gov/industry/input-output-accounts-data).
