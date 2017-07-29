class P2Pd3Sidebar {
  constructor(selector) {
    this.sidebar = $(selector)
  }
  updateSidebarSelectedNode(data) {
    var selectedNode = $(this.sidebar).find('#selected-node');
    selectedNode.addClass('node-selected');
    selectedNode.find('.node-id').html(data.id);
    selectedNode.find('.node-balance').html(data.balance);

    // selectedNode.find('.node-kademlia-table tbody tr').remove();
    // data["kademlia"]["list"].forEach(function(c){
    //   var kademliaTableRow = $('<tr></tr>')
    //     .append($('<td>'+c.node_id+'</td>'))
    //     .append($('<td>'+c.ip+':'+c.port+'</td>'))
    //     .append($('<td>'+c.distance+'</td>'));
    //   selectedNode.find('.node-kademlia-table tbody').append(kademliaTableRow);
    // })
  }
}

class P2Pd3 {

  constructor(svg) {
	  this.updatecount = 0;
    this.svg = svg;

    this.width = svg.attr("width");
    this.height = svg.attr("height");

    this.graphNodes = []
    this.graphLinks = []
    this.graphMsgs = []

    this.nodeRadius = 8;

    this.color = d3.scaleOrdinal(d3.schemeCategory20);

    this.sidebar = new P2Pd3Sidebar('#sidebar');
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
        .force("center", d3.forceCenter(this.width / 2, this.height / 2))
        .alphaDecay(0)
        .alphaMin(0);     

    this.graphLinks = links;
    this.link =this.addLinks(links);

    this.graphNodes = nodes;  
    this.node = this.addNodes(nodes);

    simulation
        .nodes(this.graphNodes)
        .on("tick", function(){ self.ticked(self.link, self.node) });

    simulation.force("link")
        .links(this.graphLinks)
        .distance(function(l,i){return 30;});

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
        .on("click", function(d) {
            //deselect
            self.node.classed("selected", function(p) { return p.selected =  p.previouslySelected = false; })
            //select
            d3.select(this).classed("selected",true);
            self.sidebar.updateSidebarSelectedNode(d);

        })
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
        //left as an example of how to set an attribute using per-edge data
        //.attr("stroke-width", function(d) { return Math.sqrt(d.value); });
        .attr("stroke-width", "1.0");
    return this.link;
  }

  updateVisualisation(newNodes,newLinks,removeNodes,removeLinks,triggerMsgs) {
	
    var self = this;
	
  	this.updatecount++;
	
    this.link = this.appendLinks(newLinks);

    this.node = this.appendNodes(newNodes);

    this.node = this.removeNodes(removeNodes);

    this.link = this.removeLinks(removeLinks);
    
    this.msg = this.triggerMsgs(triggerMsgs);

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
                    // .on("click", function(d) {
                    //     alert('test')
                    //     // if (d3.event.defaultPrevented) return;

                    //     // if (!shiftKey) {
                    //     //     //if the shift key isn't down, unselect everything
                    //     //     node.classed("selected", function(p) { return p.selected =  p.previouslySelected = false; })
                    //     // }

                    //     // // always select this node
                    //     // d3.select(this).classed("selected", d.selected = !d.previouslySelected);
                    // })
                    // .call(d3.drag()
                    //   .on("start", function(d){ self.dragstarted(self.simulation, d); } )
                    //   .on("drag", function(d){ self.dragged(d); } )
                    //   .on("end", function(d){ self.dragended(self.simulation, d); } ))
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

