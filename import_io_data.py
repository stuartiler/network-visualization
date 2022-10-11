import pandas as pd
import numpy as np
import json


# Specify a threshold to determine which links will be
# included in the final data; specifically, a link from
# a customer (i.e., an industry) to a supplier (i.e., a
# commodity) will only be included if the fraction of
# the customer's use of the supplier's output, out of
# the customer's total intermediate input use, exceeds
# the given threshold
threshold = 0.00


#
# Load the 2015 input-output data and do initial processing
#

# Read the input-output data from the Excel file, skipping the
# header rows (0 through 4) and the industry names row (6)
io_data = pd.read_excel("use_of_commodities_by_industries_2015.xls",
                        skiprows=lambda x: x in list(range(0, 5)) + [6],
                        header=0,
                        index_col=0)

# Extract the industry names from the "Commodities/Industries"
# column, ignoring everything that appears after "State and
# local government enterprises"
industry_names = list(io_data["Commodities/Industries"])
industry_names = industry_names[0:71]

# Extract the industry 3-digit-NAICS codes from the column
# headers, ignoring the first column ("Commodities/Industries")
# and everything after GSLE ("State and local government enterprises")
industry_codes = list(io_data.columns)
industry_codes = industry_codes[1:72]

# Drop all rows after "state and local government enterprises" (GSLE)
# except for "Total Intermediate" (T005)
io_data = io_data.drop(labels=["Other",
                               "Used",
                               "V001",
                               "V003",
                               "T00OTOP",
                               "VABAS",
                               "T018",
                               "T00TOP",
                               "T00SUB",
                               "VAPRO"],
                       axis="index")

# Drop the "Commodities/Industries" column and all columns after "State and
# local government enterprises" (GSLE) except for "Total Intermediate" (T001)
# and "Personal consumption expenditures" (F010)
io_data = io_data.drop(labels=["Commodities/Industries",
                               "F02E",
                               "F02N",
                               "F02R",
                               "F02S",
                               "F030",
                               "F040",
                               "F06C",
                               "F06E",
                               "F06N",
                               "F06S",
                               "F07C",
                               "F07E",
                               "F07N",
                               "F07S",
                               "F10C",
                               "F10E",
                               "F10N",
                               "F10S",
                               "T019"],
                       axis="columns")

# Replace values of "---" with zeros
io_data = io_data.replace("---", 0)


#
# Calculate the upstreamness measure for each industry
#

# Create a copy of the IO data and then drop the
# T005 ("Total Intermediate") row because it is
# not needed to calculate industry upstreamness
A = io_data.copy(deep=True)\
    .drop(labels=["T005"],
          axis="index")\

# Add the T001 ("Total Intermediate") and F010 ("Personal
# consumption expenditures") columns together to create
# a new "output" column
A["output"] = A["T001"] + A["F010"]

# Replace the dollar amounts in each column with the
# amounts divided by the "output" column
for col in industry_codes:
    A[col] = A[col] / A["output"]

# Replace NA values with zeros
A = A.fillna(0)

# Drop the T001 ("Total Intermediate"), F010 ("Personal
# consumption expenditures"), and "output" columns as
# they are no longer needed
A = A.drop(labels=["T001", "F010", "output"],
           axis="columns")

# Convert the Pandas DataFrame to a NumPy array
A = A.to_numpy()

# Create an identity matrix with the same dimensions
# as the matrix A
I = np.identity(A.shape[0])

# Calculate a type of Leontief inverse using the
# matrix A
leontief_inv = np.linalg.inv(I-A)

# Calculate upstreamness by multiplying the inverse
# by a column vector of ones
upstreamness = np.matmul(leontief_inv, np.ones((A.shape[0])))

# Convert the result back to a Pandas DataFrame with a
# single column called "upstreamness"
upstreamness = pd.DataFrame(upstreamness, columns=["upstreamness"])

# Add the industry names and the industry NAICS codes
# to the DataFrame
upstreamness["industry_name"] = industry_names
upstreamness["industry_code"] = industry_codes

# Sort the rows by the upstreamness values
upstreamness = upstreamness.sort_values(by="upstreamness")


#
# Create a matrix of output percentages
#

# Create a copy of the IO data and then drop the
# T005 ("Total Intermediate") row and the F010
# ("Personal consumption expenditures") column
# because they are not needed to calculate the
# output percentages
output_percentages = io_data.copy(deep=True)\
    .drop(labels=["T005"],
          axis="index")\
    .drop(labels=["F010"],
          axis="columns")

# Replace the dollar amounts in each column with the amounts
# divided by the T001 ("Total Intermediate") column
for col in industry_codes:
    output_percentages[col] = output_percentages[col] / output_percentages["T001"]

# Replace NA values with zeros
output_percentages = output_percentages.fillna(0)

# Drop the T001 ("Total Intermediate") column as
# it is no longer needed
output_percentages = output_percentages.drop(labels=["T001"],
           axis="columns")


#
# Create a matrix of input percentages
#

# Create a copy of the IO data and then drop the
# T001 ("Total Intermediate") and F010 ("Personal
# consumption expenditures") columns as they are
# not needed to calculate these percentages
input_percentages = io_data.copy(deep=True) \
    .drop(labels=["T001", "F010"],
          axis="columns")

# Replace the dollar amounts in each column with the
# amounts divided by the total intermediate input use
# ("T005") for each column
for col in industry_codes:
    input_percentages[col] = input_percentages[col] / input_percentages.loc["T005"][col]

# Drop the T005 ("Total Intermediate") row as it
# is no longer needed
input_percentages = input_percentages.drop(labels=["T005"],
                                           axis="index")

# Create a boolean matrix that specifies which values
# to retain based on the threshold given at the top
# of the file
entries_to_keep = input_percentages >= threshold


#
# Create a matrix of magnitudes (keeping only those magnitudes
# where the corresponding input percentage exceeds the threshold)
#

# Create a copy of the IO data and then drop the
# T005 ("Total Intermediate") row and the T001
# ("Total Intermediate") and F010 ("Personal
# consumption expenditures") columns as they
# are not needed
io_magnitudes = io_data.copy(deep=True)\
    .drop(labels=["T005"],
          axis="index")\
    .drop(labels=["T001", "F010"],
          axis="columns")

# For any entry where the corresponding input
# percentage does not exceed the given threshold,
# set the magnitude to zero
io_magnitudes = io_magnitudes[entries_to_keep].fillna(0)


#
# Write out the data in JSON format
#

# Create a list of nodes (i.e. industries) that includes,
# for each node, the associated 3-digit NAICS code, the
# industry name, and the upstreamness value
node_list = []
index = 0
for code in industry_codes:
    curr_upstreamness = np.round(float(upstreamness["upstreamness"].loc[upstreamness["industry_code"] == code]),
                                 decimals=2)
    new_node = {"id": code, "name": industry_names[index], "upstreamness": curr_upstreamness}
    node_list.append(new_node)
    index += 1

# Create a list of suppliers for each node that includes
# the supplier name and the corresponding input percentage
suppliers_list = []
for code in industry_codes:
    curr_suppliers = []
    curr_percentages = []
    curr_column = io_magnitudes[code]

    top_suppliers = curr_column.sort_values(ascending=False)
    top_suppliers = top_suppliers[0:5]
    top_suppliers = top_suppliers.index.to_list()

    for code2 in industry_codes:
        curr_val = curr_column.loc[code2]
        if curr_val > 0 and code2 != code and code2 in top_suppliers:
            curr_suppliers.append(code2)
            curr_percentages.append(np.round(input_percentages.loc[code2][code], decimals=3))

    new_supplier = {"id": code, "suppliers": curr_suppliers, "percentages": curr_percentages}
    suppliers_list.append(new_supplier)

# Create a list of customers for each node that includes the
# customer name and the corresponding output percentage
customers_list = []
for code in industry_codes:
    curr_customers = []
    curr_percentages = []
    curr_row = io_magnitudes.loc[code]

    top_customers = curr_row.sort_values(ascending=False)
    top_customers = top_customers[0:5]
    top_customers = top_customers.index.to_list()

    for code2 in industry_codes:
        curr_val = curr_row[code2]
        if curr_val > 0 and code2 != code and code2 in top_customers:
            curr_customers.append(code2)
            curr_percentages.append(np.round(output_percentages.loc[code][code2], decimals=3))

    new_customer = {"id": code, "customers": curr_customers, "percentages": curr_percentages}
    customers_list.append(new_customer)

# Create the final dataset by the combining the
# node, supplier, and customer lists together
final_data = {"nodes": node_list,
             "suppliers": suppliers_list,
             "customers": customers_list}

# Write the dataset to a JSON file
with open('production_network.json', 'w', encoding='utf-8') as f:
    json.dump(final_data, f, ensure_ascii=False, indent=2)
