class P2Pd3Sidebar {
  constructor(selector) {
    this.sidebar = $(selector)
  }
  updateSidebarSelectedNode(data) {
    //reset highlighted links if any
    visualisation.linkCollection
      .attr("stroke", "#808080")
      .attr("stroke-width", "1.5")
      .classed("stale",false);

    var selectedNode = $(this.sidebar).find('#selected-node');
    $(".node-bar").show();
    selectedNode.addClass('node-selected');
    selectedNode.find('#node-id').html(nodeShortLabel(data.id));
    selectedNode.find('#node-index').html(data.index);
    this.selectConnections(data.id);
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

  selectConnections(id) {
    //set node links to "foreground" (no opacity)
    var conns         = visualisation.nodesById[nodeShortLabel(id)];
    visualisation.linkCollection.classed("stale", true);
    var connSelection = visualisation.linkCollection.filter(function(n) {
      return conns.indexOf(n.id) > -1;
    });
    connSelection
          .attr("stroke", "#f69047")
          .attr("stroke-width", 2.5)
          .classed("stale", false);

    //set node link targets to "foreground" (no opacity)
    visualisation.nodeCollection.classed("stale", true);
    var targets       = [];
    for (var k=0;k<conns.length;k++) {
      targets.push(visualisation.connsById[conns[k]].target);
    }
    var nodesSelection = visualisation.nodeCollection.filter(function(n) {
      return targets.indexOf(n.id) > -1;
    });
    nodesSelection.classed("stale", false);
  }
}

class P2Pd3 {
  constructor(svg) {
	  this.updatecount = 0;
    this.width = svg.attr("width");
    this.height = svg.attr("height");
    this.svg = svg;

    this.graphNodes = [];
    this.graphLinks = [];
    this.graphMsgs = [];
    //for convenience; this may (or should) be "merged" with graphNodes
    this.nodesById = {};
    this.connsById = {};

    this.skipCollectionSetup = false;

    this.nodeRadius = 16;
    this.color = d3.scaleOrdinal(d3.schemeCategory20);
    this.sidebar = new P2Pd3Sidebar('#sidebar');
  }

  linkDistance(d) {
    return Math.floor(Math.random() * 11) + 80;
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

    var simulation = this.simulation = d3.forceSimulation(self.graphNodes)
        .force("link", d3.forceLink().id(function(d) { return d.id; }))
        .force("charge", d3.forceManyBody(-10))
        .force("center", d3.forceCenter(self.width / 2, self.height / 2))
        //.force("x", d3.forceX())
        //.force("y", d3.forceY())
        .alphaDecay(0)
        .alphaMin(0)     
        .on("tick", function(){ self.ticked(self.linkCollection, self.nodeCollection) });

    if (!this.skipCollectionSetup) {
      this.setupNodes();
      this.setupLinks();
    }

    simulation.force("link")
        .links(this.graphLinks)
        //.distance(function(l,i){return 80;});
        .distance(self.linkDistance);

    this.initialized = true;
  }


  setupNodes() {
    this.nodeCollection = this.svg.append("g")
        .attr("class", "nodes")
        .attr("stroke", "#fff").attr("stroke-width", 1.5)
        .selectAll(".node");
  }

  setupLinks(){
    this.linkCollection = this.svg.append("g")
        .attr("class", "links")
        .selectAll(".link");
  }


  updateVisualisation(newNodes,newLinks,removeNodes,removeLinks,triggerMsgs) {
    var self = this;
	
  	this.updatecount++;
    this.nodesChanged = false;
    this.linksChanged = false;
	
    this.appendNodes(newNodes);
    this.removeNodes(removeNodes);
    this.appendLinks(newLinks);
    this.removeLinks(removeLinks);
    
    this.msg = this.triggerMsgs(triggerMsgs);

    if (!this.initialized) {
      this.initialize();
    }

    //console.log(this.graphNodes);
    //console.log(this.graphLinks);
    this.restartSimulation();
  }

  restartSimulation() {
    // Update and restart the simulation.
    var self = this;
    // Apply the general update pattern to the nodes.
    if (this.nodesChanged) {
      this.nodeCollection = this.nodeCollection.data(self.graphNodes);
      // Apply class "existing-node" to all existing nodes
      this.nodeCollection.attr("fill","#ae81ff");
      // Remove all old nodes
      this.nodeCollection.exit().remove();
      // Apply to all new nodes (enter selection)
      this.nodeCollection = this.nodeCollection
          .enter()
          .append("circle")
          .attr("fill", "#46bc99")
          .attr("r", this.nodeRadius)
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
    }

    if (this.linksChanged) {
      // Apply the general update pattern to the links.
      this.linkCollection = this.linkCollection.data(this.graphLinks);
      this.linkCollection.exit().remove();
      this.linkCollection = this.linkCollection
          .enter()
          .append("line")
          .attr("stroke", "#808080")
          .attr("stroke-width", "1.5")
          .merge(this.linkCollection);
    }


    this.simulation.nodes(self.graphNodes);            
    this.simulation.force("link").links(self.graphLinks);
    this.simulation.force("center", d3.forceCenter(self.width/2, self.height/2));
    this.simulation.alpha(1).restart();

  }

  appendNodes(nodes){
    if (!nodes.length) { return }

    this.graphNodes = this.graphNodes.concat(nodes);
    for (var i=0; i<nodes.length; i++) {
      console.log("NEW node: " + nodes[i].id);
      this.nodesById[nodeShortLabel(nodes[i].id)] = [];
    }
    this.nodesChanged = true;
  }

  removeNodes(nodes){
    if (!nodes.length) { return }
    var self = this;

    console.log("REMOVE node: " + nodes[0].id);
    this.graphNodes = this.graphNodes.filter(function(n){ 
        var contained = false;
        for (var k=0; k<nodes.length; k++) {
          if (n.id == nodes[k].id) {
            contained = true;
            continue;
          } 
          //this wouldn't be necessary if the backend behaved deterministically with connections
          //we need to remove all nodes' connections "manually" in the frontend or we end up
          //with orphan connections 
          /*
          if (self.nodesById[nodes[k].id]) {
            self.removeNodesLinks(this.nodesById[nodes[k].id]);
          }
          */
        }
        return contained == false ; 
    });
    this.nodesChanged = true;
  }

  appendLinks(links){
    if (!links.length) { return }

    this.graphLinks = this.graphLinks.concat(links);
    for (var i=0;i<links.length;i++) {
      var id     = links[i].id;
      var source = nodeShortLabel(links[i].source);
      var target = nodeShortLabel(links[i].target);
      this.nodesById[source].push(id);
      this.nodesById[target].push(id);

      this.connsById[id] = {};
      this.connsById[id].target = links[i].target;
      this.connsById[id].source = links[i].source;
    }
    console.log("ADD connection, target: " + target + " - source: " + source);
    this.linksChanged = true;
  }

  removeNodesLinks(id) {
    var linksToRemove = [];
    for (var i=0;i<this.nodesById[id].length;i++) {
      linksToRemove.push({id: this.nodesById[id][i]});
    }
    removeLinks(linksToRemove);
    delete this.nodesById[id];
  } 

  removeLinks(links){
    if (!links.length) { return }

    var self = this;

    this.graphLinks= this.graphLinks.filter(function(n){ 
        var contained = false
        for (var k=0; k<links.length; k++) {
          if (n.id == links[k].id) {
          /*
          if (n.source == links[k].source || 
              n.source == links[k].target || 
              n.target == links[k].target ||  
              n.target == links[k].source)
            {
          */
            contained = true;
            continue;
          } 
        }
        console.log("REMOVE connection, target: " + links[0].target + " - source: " + links[0].source);
        return contained == false ; 
    });
    this.linksChanged = true;
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

function  nodeShortLabel(id) {
    return id.substr(0,8);
}
