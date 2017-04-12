class P2Pd3Sidebar {
  constructor(selector) {
    this.sidebar = $(selector)
  }
  updateSidebarSelectedNode(data) {
    var selectedNode = $(this.sidebar).find('#selected-node');
    $(".node-bar").show();
    selectedNode.addClass('node-selected');
    selectedNode.find('#node-id').html(this.nodeShortLabel(data.id));
    selectedNode.find('#node-index').html(data.index);
    //selectedNode.find('.node-balance').html(data.balance);

    var payload = [];
    payload.push(data.id);
    var jsonpayload = JSON.stringify(payload);

    var classThis = this;
  
    $.ajax({
      url: BACKEND_URL + "/"  + networkname + "/nodes",
      data: jsonpayload,
      type: "POST",
      dataType: "json"
      }).then(
        function(d){
          console.log("Successfully retrieved node info for id: " + data.id);
          var nodeDom = selectedNode.find('#node-kademlia-table');
          //console.log(d);
          nodeDom.html(classThis.formatNodeHTML(d[0]));
          nodeDom.removeClass("stale");
        },
        function(e){
          console.log("Error retrieving node info for id: " + data.id);
          console.log(e);
        }
    );

  }

  formatNodeHTML(str) {
    return str.replace(/\n/g,"<br/>");
  }

  nodeShortLabel(id) {
    return id.substr(0,8);
  }
}

class P2Pd3 {

  constructor(svg) {
	  this.updatecount = 0;
    this.svg = svg;

    this.width = svg.attr("width");
    this.height = svg.attr("height");

    this.graphNodes = [];
    this.graphLinks = [];
    this.graphMsgs = [];

    this.nodeRadius = 16;
    this.color = d3.scaleOrdinal(d3.schemeCategory20);
    this.sidebar = new P2Pd3Sidebar('#sidebar');
  }

  // increment callback function during simulation
  ticked(link,node) {
    var self = this;
    link
        .attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

    node
        .attr("cx", function(d) { return d.x = Math.max(self.nodeRadius, Math.min(self.width - self.nodeRadius, d.x)); })
        //.attr("cx", function(d) { return d.x; })
        //.attr("cy", function(d) { return d.y; });
        .attr("cy", function(d) { return d.y = Math.max(self.nodeRadius, Math.min(self.height - self.nodeRadius, d.y)) });
  }

  // event callbacks
  dragstarted(simulation,d) {
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



  initialize() {

    if (this.initialized) {
      return;
    }

    var self = this;

    var simulation = this.simulation = d3.forceSimulation(this.graphNodes)
        .force("link", d3.forceLink().id(function(d) { return d.id; }))
        .force("charge", d3.forceManyBody(-10))
        .force("center", d3.forceCenter(self.width / 2, self.height / 2))
        //.force("x", d3.forceX())
        //.force("y", d3.forceY())
        .alphaDecay(0)
        .alphaMin(0)     
        .on("tick", function(){ self.ticked(self.linkCollection, self.nodeCollection) });

    this.setupNodes();
    this.setupLinks();

    simulation.force("link")
        .links(this.graphLinks)
        .distance(function(l,i){return 80;});

    this.initialized = true;
  }


  setupNodes() {
    var self = this;
    this.nodeCollection = this.svg.append("g")
        .attr("class", "nodes")
        .selectAll("circle");
  }

  setupLinks(){
    this.linkCollection = this.svg.append("g")
        .attr("class", "links")
        .selectAll("line");
  }


  updateVisualisation(newNodes,newLinks,removeNodes,removeLinks,triggerMsgs) {

    var self = this;
	
  	this.updatecount++;
	
    this.appendNodes(newNodes);
    this.removeNodes(removeNodes);
    this.appendLinks(newLinks);
    this.removeLinks(removeLinks);
    
    this.msg = this.triggerMsgs(triggerMsgs);

    if (!this.initialized) {
      this.initialize();
    }

    this.restartSimulation();
  }

  restartSimulation() {
    // Update and restart the simulation.
    var self = this;
    // Apply the general update pattern to the nodes.
    this.nodeCollection = this.nodeCollection.data(this.graphNodes);
    // Remove all old nodes
    this.nodeCollection.exit().remove();
    // Apply class "existing-node" to all existing nodes
    this.nodeCollection.attr("class","existing-node");
    // Apply to all new nodes (enter selection)
    this.nodeCollection = this.nodeCollection
                  .enter()
                  .append("circle")
                  .attr("r", this.nodeRadius)
                  .attr("class", "new-node")
                  .attr("fill", function(d) { return self.color(100); })
                  .on("click", function(d) {
                      //deselect
                      self.nodeCollection.classed("selected", function(p) { return p.selected =  p.previouslySelected = false; })
                      //select
                      d3.select(this).classed("selected",true);
                      self.sidebar.updateSidebarSelectedNode(d);

                  })
                  .call(d3.drag()
                      .on("start", function(d){ self.dragstarted(self.simulation, d); } )
                      .on("drag", function(d){ self.dragged(d); } )
                      .on("end", function(d){ self.dragended(self.simulation, d); } ))  
                  .merge(this.nodeCollection);


    // add new links
    // Apply the general update pattern to the links.
    this.linkCollection = this.linkCollection.data(this.graphLinks);
    this.linkCollection.exit().remove();
    this.linkCollection = this.linkCollection
        .enter()
        .append("line")
				.attr("stroke", "#808080")
				.attr("stroke-width", "1.0")
				.merge(this.linkCollection);


    this.simulation.nodes(this.graphNodes);            
    this.simulation.force("link").links(this.graphLinks);
    this.simulation.force("center", d3.forceCenter(self.width/2, self.height/2));
    this.simulation.alpha(0.1).restart();

  }

  appendNodes(nodes){
    this.graphNodes = this.graphNodes.concat(nodes);
  }

  removeNodes(nodes){
    if (!nodes.length) { return }

    this.graphNodes = this.graphNodes.filter(function(n){ 
        var contained = false
        for (var k=0; k<nodes.length; k++) {
          if (n.id == nodes[k].id) {
            contained = true;
            continue;
          } 
        }
        return contained == false ; 
    });
    //this.graphNodes = this.graphNodes.filter(function(n){ return nodes.indexOf(n) < 0; })
  }

  appendLinks(links){
    this.graphLinks = this.graphLinks.concat(links);
  }

  removeLinks(links){
    if (!links.length) { return }
    //this.graphLinks = this.graphLinks.filter(function(n){ return links.indexOf(n) < 0; })
    this.graphLinks= this.graphLinks.filter(function(n){ 
        var contained = false
        for (var k=0; k<links.length; k++) {
          if (n.id == links[k].id) {
            contained = true;
            continue;
          } 
        }
        return contained == false ; 
    })
  }
  
	triggerMsgs(msgs){
		this.graphMsgs = [];
		for (var i = 0; i < msgs.length; i++) {
			var conn = this.getConnByNodes(msgs[i].source,msgs[i].target);
			if (conn != -1) {
				var line = $("g.links").find("line:nth-child(" + (conn + 1) + ")");
				//console.log("triggermsg on conn index " + conn + " obj " + line);
				$(line).attr("stroke", "#ff0000");
				this.graphMsgs.push(msgs[i]);
			} else {
				console.log("source " + msgs[i].source + " and target "+  msgs[i].target + " matched no existing conn");
			}
		}
		return this.graphMsgs;
	}


  generateUID() {
    return ("0000" + (Math.random()*Math.pow(36,4) << 0).toString(36)).slice(-4)
  }
  
  // we need an index instead for this, if too many nodes will be too slow
  getConnByNodes(sourceid,targetid) {
	  for (var i = 0; i < this.graphLinks.length; i++) {
		  if (sourceid === this.graphLinks[i].source.id && targetid === this.graphLinks[i].target.id) {
			  return i;
		  }
	  }
	  return -1;
  }

}

function generateUID() {
    return ("0000" + (Math.random()*Math.pow(36,4) << 0).toString(36)).slice(-4)
}

