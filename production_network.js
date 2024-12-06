/* production_network.js
   This file creates an interactive, production network data
   visualization using D3.js v7. It requires a JSON data
   file called production_network.json and assumes the
   presence of (1) an HTML SVG element to contain the
   network visualization, (2) an HTML SVG element to contain
   the beeswarm visualization, and (3) a simple CSS file that
   specifies, among other items, the text style, the :hover
   pseudo-classes for the industry circles, and the font
   weight for the industry name in the hover box. */


// Store references to the svg elements
var svgNetwork = d3.select("svg.svg_network"),
    svgBeeswarm = d3.select("svg.svg_beeswarm");

/* Store the x and y coordinates of the svg elements,
   shifted by the window scroll position, which allows
   the location of the hover boxes to be adjusted accordingly */
var svgRectNetwork = document.querySelector("svg.svg_network")
                             .getBoundingClientRect(),
    hover_network_adjustX = svgRectNetwork.x + window.scrollX,
    hover_network_adjustY = svgRectNetwork.y + window.scrollY;
var svgRectBeeswarm = document.querySelector("svg.svg_beeswarm")
                              .getBoundingClientRect(),
    hover_beeswarm_adjustX = svgRectBeeswarm.x + window.scrollX,
    hover_beeswarm_adjustY = svgRectBeeswarm.y + window.scrollY;

/* Set the x and y coordinates of the focus industry,
   around which everything in the main visualization
   is centered */
var focus_x = 325;
var focus_y = 350;

// Set the x coordinate of the industries in the "both" group
var both_x = 560;

// Set the x and y coordinates of the beeswarm plot
var beeswarm_x = 100;
var beeswarm_y = 250;

// Set the y coordinate of the first-degree supplier industries
var supplier_y = 200;

// Set the y coordinate of the first-degree customer industries
var customer_y = 500;

// Set the height of the beeswarm plot
var beeswarm_y_range = 400;

/* Set the colors of each of the four types of
   industries: upstream, focus, downstream, and "both" */
var supplier_color = "#FEC260";
var focus_color = "#A10035";
var customer_color = "#3FA796";
var both_color = "#2A0944";

/* Define an arrow shape to be used for the connecting
   lines between the focus industry and the suppliers
   and customers */
svgNetwork
  .append('defs')
  .append('marker')
  .attr('id', 'arrow')
  .attr('viewBox', [0, 0, 8, 5])
  .attr('refX', 8)
  .attr('refY', 2.6)
  .attr('markerWidth', 8)
  .attr('markerHeight', 5)
  .attr('orient', 'auto-start-reverse')
  .append('path')
  .attr('d', d3.line()([[0, 0], [0, 5], [8, 2.5]]))
  .attr('stroke', '#555')
  .attr("fill", "#555")
  .attr("opacity", 1);

/* Create a group for the arrows that will point
   from suppliers to the focus industry */
var upstream_links = svgNetwork.append("g")
  .attr("class", "upstream_links");

/* Create a group for the arrows that will point
   from the focus industry to the customers */
var downstream_links = svgNetwork.append("g")
  .attr("class", "downstream_links");

/* Create a group for the arrows that will point
   back-and-forth to the "both" industries */
var both_links = svgNetwork.append("g")
  .attr("class", "both_links");

/* Create a group for the focus node's second-
   degree suppliers and customers */
var node_area_2nd = svgNetwork.append("g")
  .attr("class", "node_area_2nd");

/* Create a group for the focus node and its
   first-degree suppliers and customers */
var node_area = svgNetwork.append("g")
    .attr("class", "node_area");

/* Create a group for the beeswarm chart that
   displays industries' upstreamness */
var beeswarm_area = svgBeeswarm.append("g")
  .attr("class", "beeswarm_area");

/* Create a hover box with a line for the
   industry name and two lines for additional
   details (such as percentages and upstreamness) */
var hover = svgNetwork.append("g")
  .attr("class", "hover_area")
  .attr("transform", "translate(50,50)")
  .attr("opacity", 0)
  .style("pointer-events", "none");
hover.append("rect")
  .attr("width", 300)
  .attr("height", 70)
  .attr("fill", "#eee")
  .attr("stroke", "black")
  .attr("rx", 10)
  .attr("ry", 10);
hover.append("text")
  .attr("class", "hover_indname")
  .attr("x", 10)
  .attr("y", 20)
  .text("Test");
hover.append("text")
  .attr("class", "hover_detail1")
  .attr("x", 10)
  .attr("y", 40)
  .text("Test");
hover.append("text")
  .attr("class", "hover_detail2")
  .attr("x", 10)
  .attr("y", 60)
  .text("Test");

/* Create a hover box with a line for the
   industry name and two lines for additional
   details (such as percentages and upstreamness) */
var hoverBeeswarm = svgBeeswarm.append("g")
  .attr("class", "hover_area_beeswarm")
  .attr("transform", "translate(50,50)")
  .attr("opacity", 0)
  .style("pointer-events", "none");
hoverBeeswarm.append("rect")
  .attr("width", 300)
  .attr("height", 70)
  .attr("fill", "#eee")
  .attr("stroke", "black")
  .attr("rx", 10)
  .attr("ry", 10);
hoverBeeswarm.append("text")
  .attr("class", "hover_indname")
  .attr("x", 10)
  .attr("y", 20)
  .text("Test");
hoverBeeswarm.append("text")
  .attr("class", "hover_detail1")
  .attr("x", 10)
  .attr("y", 40)
  .text("Test");
hoverBeeswarm.append("text")
  .attr("class", "hover_detail2")
  .attr("x", 10)
  .attr("y", 60)
  .text("Test");

// Set the initial focus industry to "Farms"
var focus_industry = "111CA";

/* Load the production network data and
   render the visualizations */
d3.json("production_network.json").then(function(graph) {

  /* Initialize the beeswarm chart, including the
     positions of the nodes and the svg elements
     for the title and the axis; the nodes are
     drawn and updated by the display_beeswarm()
     function, which is called at the end of
     display_nodes() */
  initialize_beeswarm(graph);

  /* Draw everthing in the main part of the visualization,
     and then call display_beeswarm() to draw or
     update the beeswarm chart */
  display_nodes(graph);

});

/* FUNCTION: display_nodes(graph)
   This function takes the JSON graph data and
   draws/updates the main part of the visualization */
function display_nodes(graph) {

  /* Create the transition for the focus node and
     first-degree nodes and set the duration */
  const t = svgNetwork.transition().duration(500);

  /* Create the transition for the focus node and
     first-degree nodes and set the duration */
  const t3 = svgBeeswarm.transition().duration(500);

  /* Create the transition for the second-degree
     nodes and the links and set the duration */
  const t2 = svgNetwork.transition().duration(1000);

  /* Extract the array of suppliers for the current
     focus industry */
  let upstream_ids = graph.suppliers
    .filter(ind => ind.id === focus_industry)[0].suppliers;

  /* Extract the array of supplier percentages for the
     current focus industry */
  let upstream_pcts = graph.suppliers
    .filter(ind => ind.id === focus_industry)[0].percentages;

  /* Extract the array of customers for the current
     focus industry */
  let downstream_ids = graph.customers
    .filter(ind => ind.id === focus_industry)[0].customers;

  /* Extract the array of customer percentages for the
     current focus industry */
  let downstream_pcts = graph.customers
    .filter(ind => ind.id === focus_industry)[0].percentages;

  /* ***
     Create an array current_nodes that has one element for
     the current focus industry and one element for each of
     its suppliers and customers
     *** */

  // Initialize the current_nodes array
  let current_nodes = [];

  /* Create an object to represent the current focus industry,
     which will be the first element in current_nodes */
  let new_element = {};

  /* Fill in the object's properties; these are:
       id: the industry's 3-digit NAICS code
       name: the industry's text name
       group: one of "focus", "supplier", "customer", or "both"
       index: the zero-based index of this industry within its group
       detail1: the first piece of detail information for the hover box
       detail2: the second piece of detail information for the hover box
       upstream_suppliers: the industry's suppliers
       downstream_customers: the industry's customers
  */
  new_element.id = focus_industry;
  new_element.name = graph.nodes
    .filter(ind => ind.id === focus_industry)[0].name +
    " (" + focus_industry + ")";
  new_element.group = "focus";
  new_element.index = 0;
  new_element.detail1 = "";
  new_element.detail2 = "";
  // This is only used for nodes in the "supplier" group (see below)
  new_element.upstream_suppliers = [];
  // This is only used for nodes in the "customer" group (see below)
  new_element.downstream_customers = [];

  // Add the object for the focus industry to the current_nodes array
  current_nodes.push(new_element);

  /* In preparation to loop through the current list of suppliers,
     initialize supplier and "both" indices to zero */
  let supplier_index = 0;
  let both_index = 0;

  // Loop through the current array of suppliers
  for(const supplier of upstream_ids) {

    // Create an object to represent the supplier
    let new_supplier_element = {};

    // Store the supplier's 3-digit NAICS code and text name
    new_supplier_element.id = supplier;
    new_supplier_element.name = graph.nodes
      .filter(ind => ind.id === supplier)[0].name +
      " (" + supplier + ")";;

    /* If this supplier is also a customer of the focus industry,
       put it in the "both" group and store both the "purchased from"
       and the "sold to" percentages */
    if(downstream_ids.includes(supplier)) {
      // Put in the "both" group and store the index
      new_supplier_element.group = "both";
      new_supplier_element.index = both_index;

      /* Store the percentage of the focus industry's inputs
         purchased from this supplier */
      new_supplier_element.detail1 = "% of focus industry's supplies purchased from industry " + supplier + ": " +
        (upstream_pcts[both_index+supplier_index] * 100).toFixed(1) + "%";

      /* Store the percentage of the focus industry's output
         sold to this industry as a customer */
      new_supplier_element.detail2 = "% of focus industry's output sold to industry " + supplier + " : " +
        (downstream_pcts[downstream_ids.findIndex((cust) => cust === supplier)] * 100).toFixed(1) + "%";

      // Increment the index for the "both" group
      both_index += 1;
    }
    /* If this supplier is only a supplier of the focus industry,
       put it in the "supplier" group and store only the "purchased
       from" percentage */
    else {
      // Put in the "supplier" group and store the index
      new_supplier_element.group = "supplier";
      new_supplier_element.index = supplier_index;

      /* Store the percentage of the focus industry's inputs
         purchased from this supplier */
      new_supplier_element.detail1 = "% of focus industry's supplies purchased from industry " + supplier + ": " +
        (upstream_pcts[both_index+supplier_index] * 100).toFixed(1) + "%";

      // Set the second detail text to empty
      new_supplier_element.detail2 = "";

      /* Retrieve this supplier's suppliers, storing their names
         and the percentages the supplier purchases from them */
      let curr_up_up_ids = graph.suppliers
        .filter(ind => ind.id === supplier)[0];
      new_supplier_element.upstream_suppliers = curr_up_up_ids.suppliers;
      new_supplier_element.upstream_percentages = curr_up_up_ids.percentages;

      /* Set these last two properties to be empty as the second-
         degree customers are only shown on the downstream side */
      new_supplier_element.downstream_customers = [];
      new_supplier_element.downstream_percentages = [];

      // Increment the index for the "supplier" group
      supplier_index += 1;
    }

    // Add the object for this supplier to the current_nodes array
    current_nodes.push(new_supplier_element);

  }

  /* In preparation to loop through the current list of customers,
     initialize a customer index to zero and reset the "both"
     index to zero */
  let customer_index = 0;
  both_index = 0;

  // Loop through the current array of customers
  for(const customer of downstream_ids) {

    // Create an object to represent the customer
    let new_customer_element = {};

    // Store the customer's 3-digit NAICS code and text name
    new_customer_element.id = customer;
    new_customer_element.name = graph.nodes
      .filter(ind => ind.id === customer)[0].name +
      " (" + customer + ")";;

    /* If this customer is also a supplier of the focus industry,
       increment the index for the "both" group by one but do not
       add an object to current_nodes for this industry because
       one was already added above (the index must be incremented
       because it is used to retrieve the "sold to" percentages;
       see code below)*/
    if(upstream_ids.includes(customer)) {
      both_index += 1;
    }
    /* If this customer is only a customer of the focus industry,
       put it in the "customer" group and store only the "sold
       to" percentage */
    else {
      // Put in the "customer" group and store the index
      new_customer_element.group = "customer";
      new_customer_element.index = customer_index;

      /* Store the percentage of the focus industry's output
         sold to this customer */
      new_customer_element.detail1 = "% of focus industry's output sold to industry " + customer + " : " +
        (downstream_pcts[both_index+customer_index] * 100).toFixed(1) + "%";

      // Set the second detail text to empty
      new_customer_element.detail2 = "";

      /* Set these two properties to be empty as the second-
         degree suppliers are only shown on the upstream side */
      new_customer_element.upstream_suppliers = [];
      new_customer_element.upstream_percentages = [];

      /* Retrieve this customer's customers, storing their names
         and the percentages the customer sells to them */
      let curr_down_down_ids = graph.customers
        .filter(ind => ind.id === customer)[0];
      new_customer_element.downstream_customers = curr_down_down_ids.customers;
      new_customer_element.downstream_percentages = curr_down_down_ids.percentages;

      // Add the object for this customer to the current_nodes array
      current_nodes.push(new_customer_element);

      // Increment the index for the "customer" group
      customer_index += 1;
    }
  }

  /* Create a linear scale for the supplier industries,
     which will determine their horizontal placement */
  let upstream_scale = d3.scaleLinear()
    .domain([0, supplier_index-1])
    .range([-50*supplier_index, 50*supplier_index]);

  /* Create a linear scale for the customer industries,
     which will determine their horizontal placement */
  let downstream_scale = d3.scaleLinear()
    .domain([0, customer_index-1])
    .range([-50*customer_index, 50*customer_index]);

  /* Create a linear scale for industries in the "both" group,
     which will determine their vertical placement */
  let both_scale = d3.scaleLinear()
    .domain([0, both_index-1])
    .range([-15*both_index, 15*both_index]);

  /* ***
     Create an array current_nodes_2nd that has one element
     for each supplier's supplier and one element for each
     customer's customer
     *** */

  // Initialize the current_nodes_2nd array
  let current_nodes_2nd = []

  /* Initialize indices to track the horizontal (h_index) and
     vertical (v_index) placement of each second-degree supplier */
  let h_index = 0;
  let v_index = 0;

  // Loop through the array of current suppliers
  for(const supplier of upstream_ids) {

    /* If this supplier is also a customer, skip it because
       it belongs to the "both" group (and second-degree
       suppliers are only shown on the upstream side)*/
    if(downstream_ids.includes(supplier)) {
      continue;
    }

    // Extract the array of this supplier's suppliers
    let curr_up_up_ids = graph.suppliers
      .filter(ind => ind.id === supplier)[0].suppliers;

    // Loop through the supplier's suppliers
    v_index = 0;
    for(const up_up of curr_up_up_ids) {

      // Create a new object for this second-degree supplier
      let new_supplier_2nd_element = {};
      new_supplier_2nd_element.side = "upstream";
      new_supplier_2nd_element.node_1st = supplier;
      new_supplier_2nd_element.h_index = h_index;
      new_supplier_2nd_element.v_index = v_index;
      new_supplier_2nd_element.name = up_up;

      // Add the object to the current_nodes_2nd array
      current_nodes_2nd.push(new_supplier_2nd_element);

      // Increment the vertical index
      v_index += 1;
    }

    // Increment the horizontal index
    h_index += 1;

  }

  /* Reset the horizontal index to zero, and then
     loop through the array of current customers */
  h_index = 0;
  for(const customer of downstream_ids) {

    /* If this customer is also a supplier, skip it because
       it belongs to the "both" group (and second-degree
       customers are only shown on the downstream side)*/
    if(upstream_ids.includes(customer)) {
      continue;
    }

    // Extract the array of this customer's customers
    let curr_down_down_ids = graph.customers
      .filter(ind => ind.id === customer)[0].customers;

    // Loop through the customer's customers
    v_index = 0;
    for(const down_down of curr_down_down_ids) {

      // Create a new object for this second-degree customer
      let new_customer_2nd_element = {};
      new_customer_2nd_element.side = "downstream";
      new_customer_2nd_element.node_1st = customer;
      new_customer_2nd_element.h_index = h_index;
      new_customer_2nd_element.v_index = v_index;
      new_customer_2nd_element.name = down_down;

      // Add the object to the current_nodes_2nd array
      current_nodes_2nd.push(new_customer_2nd_element);

      // Increment the vertical index
      v_index += 1;

    }

    // Increment the horizontal index
    h_index += 1;

  }

  /* Enter/update/exit logic for the second-degree suppliers and
     customers (including their edges); each second-degree data
     element is indexed by the combination of its side ("upstream" or
     "downstream"), the name of its first-degree supplier or customer,
     and its own name, which ensures that a particular industry can
     appear more than once as a second-degree connection */
  node_area_2nd.selectAll("g")
    .data(current_nodes_2nd, d => (d.side + d.node_1st + d.name))
    .join(
      enter => {

        /* Create new groups for the enter selection and
           set their respective positions */
        let new_group = enter.append("g")
          .attr("transform", (d,i) => {
            switch(d.side) {
              case "upstream":
                return "translate(" + (focus_x + upstream_scale(d.h_index)) + "," + (supplier_y - 20 - 30*(d.v_index+1)) + ")";
              case "downstream":
                return "translate(" + (focus_x + downstream_scale(d.h_index)) + "," + (customer_y + 20 + 30*(d.v_index+1)) + ")";
              default:
                return "translate(0,0)";
            }
          });

        // Add the horizontal connecting line for each industry
        new_group.append("line")
          .attr("stroke", "#999")
          .attr("stroke-width", 2)
          .attr("stroke-opacity", 0)
          .style("stroke", "grey")
          .attr("x1", 0)
          .attr("y1", 0)
          .attr("x2", 15)
          .attr("y2", 0);

        // Add the circle for each industry
        new_group.append("circle")
          .attr("r", 4)
          .attr("opacity", 0)
          .attr("fill", "grey")
          .attr("cx", 15)
          .attr("cy", 0);

        // Add the text label for each industry
        new_group.append("text")
          .attr("fill-opacity", 0)
          .text(function(d) {
            return d.name;
          })
          .attr("x", 25)
          .attr("y", 2.5);

      },
      update => {

        // Change the group positions for the update selection
        update.transition(t)
          .attr("transform", (d,i) => {
            switch(d.side) {
              case "upstream":
                return "translate(" + (focus_x + upstream_scale(d.h_index)) + "," + (supplier_y - 20 - 30*(d.v_index+1)) + ")";
              case "downstream":
                return "translate(" + (focus_x + downstream_scale(d.h_index)) + "," + (customer_y + 20 + 30*(d.v_index+1)) + ")";
              default:
                return "translate(0,0)";
            }
          });

      },
      exit => exit.remove()
    );

  // Add/update/remove the first-degree supplier edges
  upstream_links.selectAll("line")
    .data(current_nodes.filter(ind => ind.group === "supplier"))
    .join("line")
      .attr("stroke", "#999")
      .attr("stroke-width", 1.5)
      .attr("opacity", 0)
      .attr("marker-end", "url(#arrow)")
      .attr("x1", (d,i) => (focus_x + upstream_scale(i)))
      .attr("y1", supplier_y + 25)
      .attr("x2", (d,i) => (focus_x + (upstream_scale(i)/15)))
      .attr("y2", focus_y - 33);

  // Add/update/remove the first-degree customer edges
  downstream_links.selectAll("line")
    .data(current_nodes.filter(ind => ind.group === "customer"))
    .join("line")
      .attr("stroke", "#999")
      .attr("stroke-width", 1.5)
      .attr("opacity", 0)
      .attr("marker-end", "url(#arrow)")
      .attr("x1", (d,i) => (focus_x + (downstream_scale(i)/15)))
      .attr("y1", focus_y + 33)
      .attr("x2", (d,i) => (focus_x + downstream_scale(i)))
      .attr("y2", customer_y - 25);

  // Add/update/remove the edges for the "both" industries
  both_links.selectAll("line")
    .data(current_nodes.filter(ind => ind.group === "both"))
    .join("line")
      .attr("stroke", "#999")
      .attr("stroke-width", 1.5)
      .attr("opacity", 0)
      .attr("marker-start", "url(#arrow)")
      .attr("marker-end", "url(#arrow)")
      .attr("x1", (focus_x + 80))
      .attr("y1", (d,i) => (focus_y + both_scale(d.index)))
      .attr("x2", (focus_x + 160))
      .attr("y2", (d,i) => (focus_y + both_scale(d.index)));

  /* Enter/update/exit logic for the first-degree suppliers and
     customers (excluding their edges); each first-degree data
     element is indexed by its ID so that a particular industry
     only appears in one place (upstream, downstream, or "both")
     and will move to a new location (if applicable) when the
     focus industry is changed */
  node_area.selectAll("g")
    .data(current_nodes, d => d.id)
    .join(
      enter => {

        /* Create new groups for the enter selection
           and set their respective positions */
        let new_group = enter.append("g")
          .attr("transform", (d,i) => {
            switch(d.group) {
              case "focus":
                return "translate(" + focus_x + "," + focus_y + ")";
              case "supplier":
                return "translate(" + (focus_x + upstream_scale(d.index)) + "," + supplier_y + ")";
              case "customer":
                return "translate(" + (focus_x + downstream_scale(d.index)) + "," + customer_y + ")";
              default:
                return "translate(" + both_x + "," + (focus_y + both_scale(d.index)) + ")";
            }
          });

        /* Add the circle for each industry, including the
           logic for mouse interaction */
        new_group.append("circle")
          .attr("opacity", 0)
          .attr("stroke-width", 3)
          .attr("r", (d,i) => {
            switch(d.group) {
              case "focus":
                return 25;
              default:
                return 17;
            }
          })
          .attr("fill", (d,i) => {
            switch(d.group) {
              case "focus":
                return focus_color;
              case "supplier":
                return supplier_color;
              case "customer":
                return customer_color;
              default:
                return both_color;
            }
          })
          .on("click", (e,d) => {

            /* When an industry's circle is clicked, change the
               focus industry and call display_nodes to update
               the visualization */
            focus_industry = d.id;
            display_nodes(graph);

          })
          .on("mouseover", (e,d) => {

            /* Set the industry name and the first detail
               line in the hover box */
            hover.select(".hover_indname").text(d.name);
            hover.select(".hover_detail1").text(d.detail1);

            /* Set the hover box's height and second
               detail line depending on the group of the
               industry being inspected */
            switch(d.group) {
              case "focus":
                hover.select("rect").attr("height", 30);
                hover.select(".hover_detail1").text("");
                hover.select(".hover_detail2").text("");
                break;
              case "supplier":
              case "customer":
                hover.select("rect").attr("height", 50);
                hover.select(".hover_detail2").text("");
                break;
              default:
                hover.select("rect").attr("height", 70);
                hover.select(".hover_detail2").text(d.detail2);
                break;
            }

            /* Set the hover box's width depending on whichever
               line in the box is the longest */
            hover.select("rect").attr("width",
              Math.max(calculate_text_width(d.name),
                       calculate_text_width(d.detail1),
                       calculate_text_width(d.detail2)) + 20);

            /* Retrieve the mouse coordinates and calculate the
               hover box's x coordinate so that the box does not
               go outside of the svg container */
            let coords = d3.pointer(e, svgNetwork);
            let box_x = Math.min(coords[0] - hover_network_adjustX + 10,
              svgNetwork.attr("width") - hover.select("rect").attr("width") - 10);
            let box_y = coords[1] - hover_network_adjustY + 10;

            // Set the position of the hover box and make it visible
            hover
              .attr("transform", "translate(" + box_x + "," + box_y + ")")
              .attr("opacity", 0.9);

          })
          .on("mouseout", (e,d) => {

            /* If the mouse goes outside of the industry's circle,
               make the hover box invisible */
            hover.attr("opacity", 0);

          })
          .on("mousemove", (e,d) => {

            /* Retrieve the mouse coordinates and calculate the
               hover box's x coordinate so that the box does not
               go outside of the svg container */
            let coords = d3.pointer(e, svgNetwork);
            let box_x = Math.min(coords[0] - hover_network_adjustX + 10,
              svgNetwork.attr("width") - hover.select("rect").attr("width") - 10);
            let box_y = coords[1] - hover_network_adjustY + 10;

            // Set the new position of the hover box
            hover.attr("transform", "translate(" + box_x + "," + box_y + ")");

          });

        new_group.append("rect")
          .attr("class", "white_background_rect")
          .attr("x", -50)
          .attr("y", -11)
          .attr("width", 100)
          .attr("height", 20)
          .attr("fill", "white")
          .attr("opacity", 0.7);

        // Add the text label for each industry
        new_group.append("text")
          .text(function(d) {
            return d.name.length <= 18 ? d.name : d.name.substring(0, 18) + "...";
          })
          .attr("fill-opacity", 0)
          .attr('x', (d) => -(calculate_text_width(d.name.length <= 18 ? d.name : d.name.substring(0, 18) + "...")/2))
          .attr('y', 2);

        // Create the vertical line for each industry
        new_group.append("line")
          .attr("stroke-opacity", 0)
          .style("stroke", (d,i) => {
            switch(d.group) {
              case "focus":
                return focus_color;
              default:
                return "grey";
            }
          })
          .attr("stroke-width", 2)
          .attr("x1", 0)
          .attr("y1", (d,i) => {
            switch(d.group) {
              case "focus":
                return 0;
              case "supplier":
                return -20;
              case "customer":
                return 20;
              default:
                return 0;
            }
          })
          .attr("x2", 0)
          .attr("y2", (d,i) => {
            switch(d.group) {
              case "focus":
                return 0;
              case "supplier":
                return -20 + (-30*d.upstream_suppliers.length);
              case "customer":
                return 20 + (30*d.downstream_customers.length);
              default:
                return 0;
            }
          });

        // Fade in the circles using transition t2
        new_group.selectAll("circle").transition(t2)
          .attr("opacity", 1);

        // Fade in the text names using transition t2
        new_group.selectAll("text").transition(t2)
          .attr("fill-opacity", 1);

        // Fade in the vertical lines using transition t2
        new_group.selectAll("line").transition(t2)
          .attr("stroke-opacity", 0.5);

      },
      update => {

        // Update the groups' positions using transition t
        update.transition(t)
          .attr("transform", (d,i) => {
            switch(d.group) {
              case "focus":
                return "translate(" + focus_x + "," + focus_y + ")";
              case "supplier":
                return "translate(" + (focus_x + upstream_scale(d.index)) + "," + supplier_y + ")";
              case "customer":
                return "translate(" + (focus_x + downstream_scale(d.index)) + "," + customer_y + ")";
              default:
                return "translate(" + both_x + "," + (focus_y + both_scale(d.index)) + ")";
          }});

        // Update the circles using transition t
        update.select("circle").transition(t)
          .attr("r", (d,i) => {
            switch(d.group) {
              case "focus":
                return 25;
              default:
                return 17;
            }
          })
          .attr("fill", (d,i) => {
            switch(d.group) {
              case "focus":
                return focus_color;
              case "supplier":
                return supplier_color;
              case "customer":
                return customer_color;
              default:
                return both_color;
            }
          });

        // Update the vertical lines using transition t
        update.select("line").transition(t)
          .attr("x1", 0)
          .attr("y1", (d,i) => {
            switch(d.group) {
              case "focus":
                return 0;
              case "supplier":
                return -20;
              case "customer":
                return 20;
              default:
                return 0;
            }
          })
          .attr("x2", 0)
          .attr("y2", (d,i) => {
            switch(d.group) {
              case "focus":
                return 0;
              case "supplier":
                return -20 + (-30*d.upstream_suppliers.length);
              case "customer":
                return 20 + (30*d.downstream_customers.length);
              default:
                return 0;
            }
          })
          .style("stroke", (d,i) => {
            switch(d.group) {
              case "focus":
                return focus_color;
              default:
                return "grey";
            }
          });

        // Update the text names using transition t
        /*update.select("text").transition(t)
          .attr('x', -50)
          .attr('y', 0);*/

      },
      exit => exit.remove()
    );

    // Fade in the upstream edges using transition t2
    upstream_links.selectAll("line").transition(t2)
      .attr("opacity", 1);

    // Fade in the downstream edges using transition t2
    downstream_links.selectAll("line").transition(t2)
      .attr("opacity", 1);

    // Fade in the edges for the "both" industries using transition t2
    both_links.selectAll("line").transition(t2)
      .attr("opacity", 1);

    // Fade in the second-degree lines using transition t2
    node_area_2nd.selectAll("line").transition(t2)
      .attr("stroke-opacity", 0.5);

    // Fade in the second-degree circles using transition t2
    node_area_2nd.selectAll("circle").transition(t2)
      .attr("opacity", 1);

    // Fade in the second-degree text names using transition t2
    node_area_2nd.selectAll("text").transition(t2)
      .attr("fill-opacity", 1);

    // Call the function to update/display the beeswarm chart
    display_beeswarm(graph, upstream_ids, downstream_ids, t3);

}

/* FUNCTION: initialize_beeswarm(graph)
   This function takes the JSON graph data and initializes the
   beeswarm chart, including the positions of the nodes and
   the svg elements for the title and the axis; the nodes are
   drawn and updated by the display_beeswarm() function */
function initialize_beeswarm(graph) {

  /* Create a linear scale for the industries in the
     beeswarm plot, which will determine their
     vertical positions */
  let yScale = d3.scaleLinear().domain([4.5, 1]).range([0, beeswarm_y_range]);

  // Create the top label for the plot
  beeswarm_area.append("text")
    .attr("transform",
      "translate(" + beeswarm_x + "," + (beeswarm_y - beeswarm_y_range/2 - 30) + ")")
    .attr("text-anchor", "middle")
    .attr("fill", "#555")
    .text("upstream");

  // Create the bottom label for the plot
  beeswarm_area.append("text")
    .attr("transform",
      "translate(" + beeswarm_x + "," + (beeswarm_y + beeswarm_y_range/2 + 30) + ")")
    .attr("text-anchor", "middle")
    .attr("fill", "#555")
    .text("downstream");

  /* Set up a force simulation to determine the placement
     of the industries in the plot */
  let simulation = d3.forceSimulation(graph.nodes)
    .force('charge', d3.forceManyBody().strength(15))
    .force('center', d3.forceCenter(beeswarm_x, beeswarm_y))
    .force('x', d3.forceX().x(function(d) {
      return 0;
    }))
    .force('y', d3.forceY().y(function(d) {
      return yScale(d.upstreamness);
    }))
    .force('collision', d3.forceCollide().radius(function(d) {
      return 13;
    }))
    .stop();

  /* Run the simulation 300 times to determine the
     positions, which will remain static */
  for (let i = 0; i < 300; ++i) simulation.tick();

}

/* FUNCTION: initialize_beeswarm(graph)
   This function takes the JSON graph data, the arrays of the
   current suppliers and customers, and the transition for the
   nodes, and creates/updates the beeswarm chart */
function display_beeswarm(graph, upstream_ids, downstream_ids, t) {

    /* Define a function that returns a color based on
       the group that the given ID belongs to (focus,
       supplier, customer, or "both"); if the ID does
       not belong to any of these, return the given
       default color */
    function choose_color(id, default_color) {
      if(upstream_ids.includes(id) & downstream_ids.includes(id)) {
        return both_color;
      }
      else if(upstream_ids.includes(id)) {
        return supplier_color;
      }
      else if(downstream_ids.includes(id)) {
        return customer_color;
      }
      else if(id === focus_industry) {
        return focus_color;
      }
      else {
        return default_color;
      }
    }

    /* Enter/update/exit logic for the industries in the
       beeswarm plot */
    beeswarm_area
      .selectAll('circle')
      .data(graph.nodes)
      .join(
        enter => {

          /* Add the circle for each industry, including the
             logic for mouse interaction */
          enter.append("circle")
            .attr("stroke-width", 4)
            .attr("stroke", (d,i) => {
              return choose_color(d.id, "#aaa");
            })
            .attr("fill", (d,i) => {
              return choose_color(d.id, "#eee");
            })
            .attr('r', 10)
            .attr('cx', function(d) {
              return d.x;
            })
            .attr('cy', function(d) {
              return d.y;
            })
            .on("click", (e,d) => {

              /* When an industry's circle is clicked, change the
                 focus industry and call display_nodes to update
                 the visualization */
              focus_industry = d.id;
              display_nodes(graph);

            })
            .on("mouseover", (e,d) => {

              /* Set the hover box's width depending on whichever
                 line in the box is the longest; set its height
                 to a constant as it will always have two lines */
              hoverBeeswarm.select("rect").attr("width",
                Math.max(calculate_text_width(d.name + " (" + d.id + ")"),
                         calculate_text_width("Upstreamness: " + d.upstreamness)) + 20);
              hoverBeeswarm.select("rect").attr("height", 50);

              // Set the hover box's content
              hoverBeeswarm.select(".hover_indname").text(d.name + " (" + d.id + ")");
              hoverBeeswarm.select(".hover_detail1").text("Upstreamness: " + d.upstreamness);
              hoverBeeswarm.select(".hover_detail2").text("");

              /* Retrieve the mouse coordinates and calculate the
                 hover box's x coordinate so that the box does not
                 go outside of the svg container */
              let coords = d3.pointer(e, svgBeeswarm);
              let box_x = Math.min(coords[0] - hover_beeswarm_adjustX + 10,
                svgBeeswarm.attr("width") - hoverBeeswarm.select("rect").attr("width") - 10);
              let box_y = coords[1] - hover_beeswarm_adjustY + 10;

              // Set the position of the hover box and make it visible
              hoverBeeswarm
                .attr("transform", "translate(" + box_x + "," + box_y + ")")
                .attr("opacity", 0.9);

            })
            .on("mouseout", (e,d) => {

              /* If the mouse goes outside of the industry's circle,
                 make the hover box invisible */
              hoverBeeswarm.attr("opacity", 0);

            })
            .on("mousemove", (e,d) => {

              /* Retrieve the mouse coordinates and calculate the
                 hover box's x coordinate so that the box does not
                 go outside of the svg container */
              let coords = d3.pointer(e, svgBeeswarm);
              let box_x = Math.min(coords[0] - hover_beeswarm_adjustX + 10,
                svgBeeswarm.attr("width") - hoverBeeswarm.select("rect").attr("width") - 10);
              let box_y = coords[1] - hover_beeswarm_adjustY + 10;

              // Update the position of the hover box
              hoverBeeswarm.attr("transform", "translate(" + box_x + "," + box_y + ")");

            });

        },
        update => {

          // Update the circles using the given transition t
          update.transition(t)
            .attr("stroke", (d,i) => {
              return choose_color(d.id, "#aaa");
            })
            .attr("fill", (d,i) => {
              return choose_color(d.id, "#eee");
            });

        },
        exit => exit.remove()
      );

}

/* FUNCTION: calculate_text_width(text)
   This function takes a string and returns the width of
   the rendered text in pixels; note that the function
   assumes the relevant font is whatever the font of the
   hover box's industry name text element is; thanks to
   poster Domi on Stack Overflow for outlining this method
*/
function calculate_text_width(text) {

  // Create a canvas element if one does not already exist
  const canvas = calculate_text_width.canvas ||
    (calculate_text_width.canvas = document.createElement("canvas"));

  // Get the context
  const context = canvas.getContext("2d");

  /* Set the font to the current font of the hover box's
     industry name text element */
  context.font = window
    .getComputedStyle(document.querySelector(".hover_indname"), null)
    .getPropertyValue("font");

  // Use the context's measureText function on the given text
  const metrics = context.measureText(text);

  // Return the width
  return metrics.width;

}
