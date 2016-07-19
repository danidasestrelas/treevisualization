 /* This file is released under the GNU General Public License, version 3
 * */
 var jsonFile = "minitree.json";
            var dataset;
            var dataP;
            var inicialTree = [];


            var margin = {top: 20, right: 120, bottom: 20, left: 120},
                width = 1000 - margin.right - margin.left,
                height = 800 - margin.top - margin.bottom;
                
            var i = 0,
                duration = 750,
                root;

            var tree = d3.layout.tree()
                .size([height, width]);

            var diagonal = d3.svg.diagonal()
                .projection(function(d) { return [d.y, d.x]; });

            var svg = d3.select("body").append("svg")
                .attr("width", width + margin.right + margin.left)
                .attr("height", height + margin.top + margin.bottom)
              .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            

                d3.json(jsonFile, function(error, data){
                if(error){
                    console.log(error);
                } else {
                    console.log(data);

                    //dataP = data;
                    dataset = jsonToFlare(data);
                    root = dataset[0];
                    root.x0 = height / 2;
                    root.y0 = 0;
                      
                    update(root);

                    d3.select(self.frameElement).style("height", "500px");


                    var open = [];
                    /* For the start configuration of the tree
                    * takes the first node of each level and let
                    * their open
                    * */
                    for(var i = 0; i < data.levels-1; i++){
                        open.push(pidFop(data.partitionSize, i));
                    }
                    inicialTree = open;
                    closeTree(root, open);

                    /* reset button using the open list configuration
                    * */
                    d3.select("body").append("input")
                    .attr("type", "button")
                    .attr("value", "Reset Tree")
                    .on("click", function(){closeTree(root, open)});

                    /* Create the select list for the objects names
                    * */
                    var text = d3.select("body").append("select")
                      .attr('id', "valueText");

                    /* add to the objects from the objectsMapping
                    * a link to their father in order to find the path
                    * for then later when the user selects an object
                    * */
                    var optionList = [];
                    for(i in data.objectMapping)
                    {
                        for(var j = 0; j < data.objectMapping[i].length; j++){
                            if(data.objectMapping[i][j] != null)
                                data.objectMapping[i][j]['parent'] = i;
                        }
                        optionList = optionList.concat(data.objectMapping[i]);
                    }
                    /* The value of an <option> is the parent number
                    * */
                    text.selectAll('option')
                      .data(optionList).enter()
                      .append('option').text(function(d){return d.objName})
                      .attr('value',function(d){return d.parent} );

                    /* By clicking the search button it calls the leafPath function
                    *  with the value of the option selected
                    * */
                    d3.select("body").append("input")
                    .attr("type", "button")
                    .attr("value", "Search Node")
                    .on("click", function(){
                        var path = [];
                        leafPath(parseInt(text.property("value")),data.partitionSize,path);
                        closeTree(root, path);
                    });

                }


            });

            function leafPath(number, ps, path){
                /* By a number/key node name, finds all the path
                *  from the root to this current number
                *  returning it in a list
                * */
              if(number>0){
                var parent = parseInt((number-1)/ps);
                path.push(number);
                  leafPath(parent, ps, path);
              }else {
                  path.push(0);
              }
            }
            function closeTree(source, openNodes){
                /* Uses the click function to let just the nodes
                *  in the array openNodes open in the tree. the remain
                *  do not show its children
                * */
              var nodes = tree.nodes(source).reverse();

                nodes.forEach(function(d) {
                    if (d.children != null && openNodes.indexOf(d.name) < 0) {
                        click(d);
                        //console.log(d);
                    }
                    else if(d._children != null &&  openNodes.indexOf(d.name) >-1){
                        click(d);
                    }
                });
            }

            function update(source) {

              // Compute the new tree layout.
              var nodes = tree.nodes(root).reverse(),  // list of the nodes objects, descending
                  links = tree.links(nodes);

              // Normalize for fixed-depth.
              nodes.forEach(function(d) { d.y = d.depth * 100; }); // the distance between nodes

              // Update the nodes…
              var node = svg.selectAll("g.node")
                  .data(nodes, function(d) { return d.id || (d.id = ++i); });

              // Enter any new nodes at the parent's previous position.
              var nodeEnter = node.enter().append("g")
                  .attr("class", "node")
                  .attr("transform", function() { return "translate(" + source.y0 + "," + source.x0 + ")"; })
                  .on("click", click);

                // append circles and rects to the nodes
              nodeEnter.append("circle")
                  .attr("r", 1e-6)
                  .style("fill", function(d) {  return d._children ? "lightsteelblue" : "#fff"; });

                nodeEnter.append("rect")
                    .attr("width", 0)
                    .attr("height", 0)
                    .style("fill", function(d) {
                        if (d.type == "master") return "#f26363";
                        else  return d._children ? "lightsteelblue" : "#fff"; });


               /**nodeEnter.append("svg:image")
               .attr("xlink:href", function (d) { return d.name == 0 ? "keyBlue.png" : "";})
                .attr("x", "-24px")
                .attr("y", "-24px")
                .attr("width", "48px")
                .attr("height", "48px");*/
                

               // the label of the node
              nodeEnter.append("text")
                  .attr("x", function(d) { return d.children || d._children ? -13 : 13; })
                  .attr("dy", ".35em")
                  .attr("text-anchor", function(d) { return d.children || d._children ? "end" : "start"; })
                  .text(function(d) { return d.name; })
                  .style("fill-opacity", 1e-6);

              // Transition nodes to their new position.
              var nodeUpdate = node.transition()
                  .duration(duration)
                  .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });

                // the new style after the transition
              nodeUpdate.select("circle")
                  .attr("r", function(d) {  return d.type == "object" ? 0 : 10; })
                  .style("fill", function(d) {
                      if (d.type == "master") return "#f4c0c0";
                      else  return d._children ? "lightsteelblue" : "#fff"; })
                  .style("stroke", function(d) {
                      if (d.type == "master")
                          return "red";
                        else if(d.type == "object")
                          return "gray";
                        else
                          return "steelblue";  });

                nodeUpdate.select("rect")
                    .attr("width",function(d) {  return d.type == "object" ? 10 : 0; } )
                    .attr("height",function(d) {  return d.type == "object" ? 15 : 0; } )
                    .style("fill", function(d) {  return d._children ? "lightsteelblue" : "#fff"; })
                    .style("stroke", function(d) {
                        if (d.type == "master")
                          return "red";
                        else if(d.type == "object")
                          return "gray";
                        else
                          return "steelblue";  });

              nodeUpdate.select("text")
                  .style("fill-opacity", 1);

              // Transition exiting nodes to the parent's new position.
              var nodeExit = node.exit().transition()
                  .duration(duration)
                  .attr("transform", function() { return "translate(" + source.y + "," + source.x + ")"; })
                  .remove();

              nodeExit.select("circle")
                  .attr("r", 1e-6);

              nodeExit.select("text")
                  .style("fill-opacity", 1e-6);

              // Update the links…
              var link = svg.selectAll("path.link")
                  .data(links, function(d) { return d.target.id; });

              // Enter any new links at the parent's previous position.
              link.enter().insert("path", "g")
                  .attr("class", "link")
                  .attr("d", function() {
                    var o = {x: source.x0, y: source.y0};
                    return diagonal({source: o, target: o});
                  });

              // Transition links to their new position.
              link.transition()
                  .duration(duration)
                  .attr("d", diagonal);

              // Transition exiting nodes to the parent's new position.
              link.exit().transition()
                  .duration(duration)
                  .attr("d", function() {
                    var o = {x: source.x, y: source.y};
                    return diagonal({source: o, target: o});
                  })
                  .remove();

              // Stash the old positions for transition.
              nodes.forEach(function(d) {
                d.x0 = d.x;
                d.y0 = d.y;
              });
            }

            // Toggle children on click.
            function click(d) {
              if (d.children) {
                d._children = d.children;
                d.children = null;
              } else {
                d.children = d._children;
                d._children = null;
              }
              update(d);
            }


                function jsonToFlare(data){
                    /* Start with the root of the tree that is always 0
                    *  Then get all the other nodes recursively using getChildren
                    * */
                    var name = 0; //pidFop(data.partitionSize, 0);  it is always 0
                    var children = getChildren(name, 1, data);
                    return [{"name": name, "children": children, "type": "master"}];
                }

                function getChildren(parent, level, data){
                    var children = [];
                    var siblings = [];
                    var k = 0;
                    var i;
                    if(level == data.levels){
                        /* Case that maps the objects keys to the leafs
                        *  their behavior is different since their name is not related to te tree structure
                        *  as are the non-objects-partitions nodes
                        * */
                        var objects = data.objectMapping[parent];

                        if(objects != null) {
                            if (objects.lentght > 5){
                                /* Creates the first plus node with no siblings
                                * show: false , because it will not appear yet
                                * */
                                children[0] = {name: "first", "children": null, "type": "plus", "siblings": siblings, "show": false};
                                /* Iterates in all children
                                * */
                                for (i = 1; i <= objects.length; i++) {
                                    /* Just plus nodes have siblings
                                    * */
                                    if(i <= 5)
                                        children[i] = {name: objects[i].objName, "children": null, "type": "object", "show": true};
                                    else
                                        /* Hide the children
                                        * */
                                        children[i] = {name: objects[i].objName, "children": null, "type": "object", "show": false};

                                }
                                /* Add the last plus
                                * */
                                children[i] = {name: "first", "children": null, "type": "plus", "siblings": siblings, "show": false}

                                /* Add the siblings to the plus nodes
                                * */
                                children[0]["siblings"] = children;
                                children[i]["siblings"] = children;
                            }
                            else {
                                for (i = 0; i < objects.length; i++) {
                                    children[i] = {name: objects[i].objName, "children": null, "type": "object"};
                                }
                            }
                        }
                    }
                    else {
                        /* For the actual parent node it calculates the first and last children
                        * and see if all its interval of children are in the used partition
                        * and add the ones that are
                        * */
                        var first = (parent*data.partitionSize) + 1;
                        var last = (parent+1)*data.partitionSize;

                        for (i = first; i <= last; i++) { // for each child of this parent
                            if (data.usedPartitions.indexOf(i) > -1) {
                                if (level < data.levels)
                                    children[k] = {"name": i, "children": getChildren(i, level + 1, data), "type": "key"};
                            }
                            // if a node is not in used partitions, it is not showed
                            k++;
                        }
                    }
                    return children;
                }

                function pidFop(ps, level){
                    /* Calculates the first node of a level
                    * */
                    return (Math.pow(ps, level) - 1)/(ps-1);
                }
