 // This file is released under the GNU General Public License, version 3
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

                    dataP = data;
                    dataset = jsonToFlare(data);
                    root = dataset[0];
                    root.x0 = height / 2;
                    root.y0 = 0;
                      
                    update(root);

                    d3.select(self.frameElement).style("height", "500px");

                    var open = [];
                    for(var i = 0; i < data.levels-1; i++){
                        open.push(pidFop(data.partitionSize, i));
                    }
                    inicialTree = open;
                    closeTree(root, open);

                    var resetButton = d3.select("body").append("input")
                    .attr("type", "button")
                    .attr("value", "Reset Tree")
                    .on("click", function(){closeTree(root, open)});

                    var text = d3.select("body").append("select")
                      .attr('id', "valueText")

                    var optionList = [];
                    for(var i in dataP.objectMapping)
                    {
                        for(var j = 0; j < dataP.objectMapping[i].length; j++){
                            if(dataP.objectMapping[i][j] != null)
                                dataP.objectMapping[i][j]['parent'] = i;
                        }
                        optionList = optionList.concat(dataP.objectMapping[i]);
                    }
                    var options = text.selectAll('option')
                      .data(optionList).enter()
                      .append('option').text(function(d){return d.objName})
                        .attr('value',function(d){return d.parent} );
                    /*
                    var text = d3.select("body").append("input")
                        .attr("id", "valueText")
                    .attr("type", "text")
                    .attr("value", "");*/

                     var searchButton = d3.select("body").append("input")
                    .attr("type", "button")
                    .attr("value", "Search Node")
                    .on("click", function(){
                        var path = [];
                        leafPath(parseInt(text.property("value")),data.partitionSize,path);
                        closeTree(root, path);
                    });

                }


            });

            function leafPath(number, ps, path){//console.log(number);
              if(number>0){
                var parent = parseInt((number-1)/ps);
                path.push(number);
                  leafPath(parent, ps, path);
              }else {
                  path.push(0);
              }
            }
            function closeTree(source, openNodes){
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
              var nodes = tree.nodes(root).reverse(),
                  links = tree.links(nodes);

              // Normalize for fixed-depth.
              nodes.forEach(function(d) { d.y = d.depth * 100; }); //Distancia entre nodos --> comprimento arestas

              // Update the nodes…
              var node = svg.selectAll("g.node")
                  .data(nodes, function(d) { return d.id || (d.id = ++i); });

              // Enter any new nodes at the parent's previous position.
              var nodeEnter = node.enter().append("g")
                  .attr("class", "node")
                  .attr("transform", function(d) { return "translate(" + source.y0 + "," + source.x0 + ")"; })
                  .on("click", click);

              nodeEnter.append("circle")
                  .attr("r", 1e-6)
                  .style("fill", function(d) {  return d._children ? "lightsteelblue" : "#fff"; });



               /**nodeEnter.append("svg:image")
               .attr("xlink:href", function (d) { return d.name == 0 ? "keyBlue.png" : "";})
                .attr("x", "-24px")
                .attr("y", "-24px")
                .attr("width", "48px")
                .attr("height", "48px");*/
                

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

              nodeUpdate.select("circle")
                  .attr("r", 10)
                  .style("fill", function(d) {  return d._children ? "lightsteelblue" : "#fff"; })
                  .style("stroke", function(d) { if (d.name == 0) 
                      return "orange";
                    else
                      return "steelblue";  });


              nodeUpdate.select("text")
                  .style("fill-opacity", 1);

              // Transition exiting nodes to the parent's new position.
              var nodeExit = node.exit().transition()
                  .duration(duration)
                  .attr("transform", function(d) { return "translate(" + source.y + "," + source.x + ")"; })
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
                  .attr("d", function(d) {
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
                  .attr("d", function(d) {
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
                    return [{"name": name, "children": children}];
                }

                function getChildren(parent, level, data){
                    var children = [];
                    var k = 0;

                    if(level == data.levels){
                        /* Case that maps the objects keys to the leafs
                        *  their behavior is different since their name is not related to te tree structure
                        *  as are the non-objects-partitions nodes
                        * */
                        var objects = data.objectMapping[parent];
                        if(objects != null) {
                            for (var i = 0; i < objects.length; i++) {
                                children[i] = {name: objects[i].objName, "children": null};
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

                        for (var i = first; i <= last; i++) { // for each child of this parent
                            if (data.usedPartitions.indexOf(i) > -1) {
                                if (level < data.levels)
                                    children[k] = {"name": i, "children": getChildren(i, level + 1, data)};
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
