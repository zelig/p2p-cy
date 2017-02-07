class P2Pd3 {

  constructor(svg) {
	this.updatecount = 0;
    this.svg = svg;

    this.width = svg.attr("width");
    this.height = svg.attr("height");

    this.graphNodes = []
    this.graphLinks = []

    this.nodeRadius = 5;

    this.color = d3.scaleOrdinal(d3.schemeCategory20);
  }

  // increment callback function during simulation
  ticked(link,node) {
    link
        .attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

    node
        .attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; });
  }

  // event callbacks
  dragstarted(simulation,d) {
    console.log(d.id)
    if (!d3.event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  dragged(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
  }

  dragended(simulation,d) {
    if (!d3.event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  } 
  // end event callbacks

  initializeVisualisation(nodes,links) {

    var self = this;

    var simulation = this.simulation = d3.forceSimulation()
        .force("link", d3.forceLink().id(function(d) { return d.id; }))
        .force("charge", d3.forceManyBody())
        .force("center", d3.forceCenter(this.width / 2, this.height / 2));     

    this.graphLinks = links;
    this.link =this.addLinks(links);

    this.graphNodes = nodes;  
    this.node = this.addNodes(nodes);

    simulation
        .nodes(this.graphNodes)
        .on("tick", function(){ self.ticked(self.link, self.node) });

    simulation.force("link")
        .links(this.graphLinks)
        // .distance(function(l,i){return (22-l.value)*22;});

    this.node
        .attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; });
    }

  addNodes(nodes){
    var self = this;
    this.node = this.svg.append("g")
        .attr("class", "nodes")
        .selectAll("circle")
        .data(nodes)
        .enter().append("circle")
        .attr("r", this.nodeRadius)
        .attr("fill", function(d) { return self.color(d.group); })
        .call(d3.drag()
            .on("start", function(d){ self.dragstarted(self.simulation, d); } )
            .on("drag", function(d){ self.dragged(d); } )
            .on("end", function(d){ self.dragended(self.simulation, d); } ));   

    return this.node;
  }

  addLinks(links){
    this.link = this.svg.append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(links)
        .enter().append("line")
        .attr("stroke", "#808080")
        // this seems to increment per link in array, independent of which nodes the link belongs to
        //.attr("stroke-width", function(d) { return Math.sqrt(d.value); });
        // ... which doesn't give us useful info, and it renders the first invisible ("0")
        .attr("stroke-width", "1.0");
    return this.link;
  }

  updateVisualisation(newNodes,newLinks,removeNodes,removeLinks) {
	
    var self = this;
	
	this.updatecount++;
	
    this.link = this.appendLinks(newLinks);

    this.node = this.appendNodes(newNodes);

    this.node = this.removeNodes(removeNodes);

    this.link = this.removeLinks(removeLinks);

    // // Update and restart the simulation.
    this.simulation.nodes(this.graphNodes);            
    this.simulation.force("link").links(this.graphLinks);

    // this.simulation.force("center", d3.forceCenter(300, 200));

    this.simulation.alpha(1).restart();

  }

  appendNodes(nodes){
    var self = this;
    for (var i = nodes.length - 1; i >= 0; i--) {
     this.graphNodes.push(nodes[i]); 
    }
    this.node = this.node.data(this.graphNodes, function(d) { return d.id;});
    this.node = this.node
                    .enter()
                    .append("circle")
                    .attr("fill", function(d) { return d3.scaleOrdinal(d3.schemeCategory20)(d.group) })
                    .attr("r", 5)
                    .attr("x",500)
                    .call(d3.drag()
                      .on("start", function(d){ self.dragstarted(self.simulation, d); } )
                      .on("drag", function(d){ self.dragged(d); } )
                      .on("end", function(d){ self.dragended(self.simulation, d); } ))
                    .merge(this.node);

    return this.node;
  }

  removeNodes(nodes){
    this.graphNodes = this.graphNodes.filter(function(n){ return nodes.indexOf(n) < 0; })
    this.node = this.node.data(this.graphNodes, function(d) { return d.id;});
    this.node.exit().remove();
    return this.node;
  }

  appendLinks(links){

    this.graphLinks = this.graphLinks.concat(links);

    // Apply the general update pattern to the links.
    this.link = this.link.data(this.graphLinks);

    // add new links
    this.link = this.link.enter().append("line")
				.attr("stroke", "#808080")
				.attr("stroke-width", "1.0")
				.merge(this.link);
    
    return this.link;
  }

  removeLinks(links){
    this.graphLinks = this.graphLinks.filter(function(n){ return links.indexOf(n) < 0; })
    this.link = this.link.data(this.graphLinks);
    this.link.exit().remove();
    return this.link;
  }

  generateUID() {
    return ("0000" + (Math.random()*Math.pow(36,4) << 0).toString(36)).slice(-4)
  }

}

function generateUID() {
    return ("0000" + (Math.random()*Math.pow(36,4) << 0).toString(36)).slice(-4)
}

var BACKEND_URL='http://127.0.0.1:8888';

var networkname = "metaschmeta";

var cursor = 0;

var prereqs = [
	{method: "POST", url: "/node", payload: null,},
	{method: "POST", url: "/node", payload: null,},	
	{method: "POST", url: "/node", payload: null,},	
	{method: "POST", url: "/node", payload: null,},
	{method: "POST", url: "/node", payload: null,},	
	{method: "POST", url: "/node", payload: null,},	
	{method: "POST", url: "/node", payload: null,},
	{method: "POST", url: "/node", payload: null,},	
	{method: "POST", url: "/node", payload: null,},	
	{method: "POST", url: "/node", payload: null,},	
	
	{method: "PUT", url: "/node", payload: {One: 1},},
	{method: "PUT", url: "/node", payload: {One: 2},},
	{method: "PUT", url: "/node", payload: {One: 3},},
	{method: "PUT", url: "/node", payload: {One: 4},},
	{method: "PUT", url: "/node", payload: {One: 5},},
	{method: "PUT", url: "/node", payload: {One: 6},},
	{method: "PUT", url: "/node", payload: {One: 7},},
	{method: "PUT", url: "/node", payload: {One: 8},},
	{method: "PUT", url: "/node", payload: {One: 9},},
	{method: "PUT", url: "/node", payload: {One: 10},},
	
	{method: "PUT", url: "/node", payload: {One: 1, Other: 2}},
	{method: "PUT", url: "/node", payload: {One: 2, Other: 3}},
	{method: "PUT", url: "/node", payload: {One: 3, Other: 4}},
	{method: "PUT", url: "/node", payload: {One: 4, Other: 5}},
	{method: "PUT", url: "/node", payload: {One: 5, Other: 6}},
	{method: "PUT", url: "/node", payload: {One: 6, Other: 7}},
	{method: "PUT", url: "/node", payload: {One: 7, Other: 8}},
	{method: "PUT", url: "/node", payload: {One: 8, Other: 9}},
	{method: "PUT", url: "/node", payload: {One: 9, Other: 10}},
	
	{method: "PUT", url: "/node", payload: {One: 1, Other: 2, AssetType: 1}},
]

var postreqs = [
	{method: "PUT", url: "/node", payload: {One: 10, Other: 1}},
	{method: "PUT", url: "/node", payload: {One: 1, Other: 2, AssetType: 1}},
]

initializeServer();

function initializeServer(){
		console.log("we have a snapshot of " + prereqs.length + " requests and animation of " + postreqs.length + " requests linedup for you in this run");
          $.post(BACKEND_URL + "/", JSON.stringify({"Id":networkname})).then(
            function(d){
              console.log("Backend POST init ok");
              //initializeMocker();
              //setTimeout(initializeVisualisationWithClass,1000);
              //setInterval(testPostSequence, 1000);
              //initializeVisualisation(networkname);
              //initializeVisualisationWithClass(networkname);
              preSequence(networkname);
				
            },
            function(e) { 
              console.log("Error sending POST to " + BACKEND_URL); 
              console.log(e); 
            })
};

function preSequence(networkname_) {
	
	if (cursor == prereqs.length)
		return false;
		
	var effectiveurl = BACKEND_URL + "/" + networkname_ + prereqs[cursor].url + "/";
	$.ajax({
		type: prereqs[cursor].method,
		url: effectiveurl,
		dataType: "json",
		mimeType: "application/json",
		data: JSON.stringify(prereqs[cursor].payload),
	}).done(function() {
		cursor++;
		
		if (cursor == prereqs.length) {
			initializeVisualisationWithClass(networkname);
			
		} else {
			preSequence(networkname_);
		}
	});	
	
	return true;
}

function postSequence(networkname_) {
	if (cursor == postreqs.length)
		return false;
		
	var effectiveurl = BACKEND_URL + "/" + networkname_ + postreqs[cursor].url + "/";
	$.ajax({
		type: postreqs[cursor].method,
		url: effectiveurl,
		dataType: "json",
		mimeType: "application/json",
		data: JSON.stringify(postreqs[cursor].payload),
	}).done(function() {
		cursor++;
		updateVisualisationWithClass(networkname, 100, postSequence);
	});	
	
	return true;
}

/*
function initializeMocker() {
          $.post(BACKEND_URL + '0/mockevents/').then(
            function(d){
              console.log("Backend initializeMocker OK");
              setTimeout(initializeVisualisationWithClass,1000);
              
            },
            function(e){ 
              console.log("Error initializing mockevents at " + BACKEND_URL + '0/mockevents/');
              console.log(e); 
          })
};
*/

function initializeVisualisationWithClass(networkname_){

            console.log("Initializing visualization");
            var self = this;

            this.visualisation 
                = window.visualisation 
                = new P2Pd3(d3.select("svg"));

            $.get(BACKEND_URL + '/' + networkname_ + "/").then(
              function(graph){
                console.log("Received graph data from backend");
                self.graphNodes = $(graph.add)
                    .filter(function(i,e){return e.group === 'nodes'})
                    .map(function(i,e){ return {id: e.data.id, group: 1}; })
                    .toArray();

                self.graphLinks = $(graph.add)
                    .filter(function(i,e){return e.group === 'edges'})
                    .map(function(i,e){ 
                        return {
                            source: e.data.source, 
                            target: e.data.target, 
                            group: 1,
                            value: i
                        };
                    })
                    .toArray();

                self.visualisation.initializeVisualisation(self.graphNodes,self.graphLinks);

                //self.visualisationInterval = setInterval(updateVisualisationWithClass,1000);
                //setTimeOut(function() {updateVisualisationWithClass(networkname_, 1, testPostSequence)}, 0);
                //updateVisualisationWithClass(networkname_, 1, testPostSequence)
                cursor = 0;
                setTimeout(function() {postSequence(networkname_)}, 1000);
              },
              function(e){ console.log(e); }
            )
};


function updateVisualisationWithClass(networkname_, delay, callback){

            var self = this;
            $.get(BACKEND_URL + '/' + networkname_ + "/").then(
                function(graph){
                    
                    var newNodes = $(graph.add)
                    .filter(function(i,e){return e.group === 'nodes'})
                    .map(function(i,e){ return {id: e.data.id, group: 1}; })
                    .toArray();

                    var newLinks = $(graph.add)
                    .filter(function(i,e){return e.group === 'edges'})
                    .map(function(i,e){ 
                        return {
                            source: e.data.source, 
                            target: e.data.target, 
                            group: 1,
                            value: i
                        };
                    })
                    .toArray();

                    var removeNodes = $(graph.remove)
                    .filter(function(i,e){return e.group === 'nodes'})
                    .map(function(i,e){ return {id: e.data.id, group: 1}; })
                    .toArray();

                    var removeLinks = $(graph.remove)
                    .filter(function(i,e){return e.group === 'edges'})
                    .map(function(i,e){ 
                        return {
                            source: e.data.source, 
                            target: e.data.target, 
                            group: 1,
                            value: i
                        };
                    })
                    .toArray();

                    if(newNodes.length > 0 || newLinks.length > 0 || removeNodes.length > 0 || removeLinks.length > 0 )
						self.visualisation.updateVisualisation(newNodes,newLinks,removeNodes,removeLinks);
                    
                    setTimeout(function() {callback(networkname_)}, delay);
                },
                function(e){ console.log(e); }
            )

        };


function restartVisualisationWithClass(){
            var randID = generateUID();
            var randID2 = generateUID();

            var newNode = {id: randID, group: 2, x: 500, y: 500 }
            var newNode2 = {id: randID2, group: 2, x: 500, y: 500 }
            
            var newNodes = [newNode,newNode2];

            var randNode1 = this.graphNodes[parseInt(Math.random(0,this.graphNodes.length)*10)];
            var randNode2 = this.graphNodes[parseInt(Math.random(0,this.graphNodes.length)*10)];
            var randNode3 = this.graphNodes[parseInt(Math.random(0,this.graphNodes.length)*10)];

            var randNode21 = this.graphNodes[parseInt(Math.random(0,this.graphNodes.length)*10)];
            var randNode22 = this.graphNodes[parseInt(Math.random(0,this.graphNodes.length)*10)];
            var randNode23 = this.graphNodes[parseInt(Math.random(0,this.graphNodes.length)*10)];



            var newLinks = []

            newLinks.push({source: newNode, target: randNode1, group: 1, value: 1 }); // Add a-b.
            newLinks.push({source: newNode, target: randNode2, group: 1, value: 1 }); // Add a-b.
            newLinks.push({source: newNode, target: randNode3, group: 1, value: 1 }); // Add a-b.

            newLinks.push({source: newNode2, target: randNode21, group: 1, value: 1 }); // Add a-b.
            newLinks.push({source: newNode2, target: randNode22, group: 1, value: 1 }); // Add a-b.
            newLinks.push({source: newNode2, target: randNode23, group: 1, value: 1 }); // Add a-b.


            newNodes = []
            newLinks = []
            var removeNodes = [randNode1,randNode2];
            var removeLinks = this.graphLinks.filter(function(l){
                return randNode1.id == l.source.id || randNode1.id == l.target.id; //connected nodes
            })
            var removeLinks2 = this.graphLinks.filter(function(l){
                return randNode2.id == l.source.id || randNode2.id == l.target.id; //connected nodes
            })
          

            this.visualisation.updateVisualisation(newNodes,newLinks,removeNodes,removeLinks.concat(removeLinks2));
        }
