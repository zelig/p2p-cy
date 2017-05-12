class P2Pd3Sidebar {
  constructor(selector, viz) {
    this.sidebar = $(selector)
    this.visualisation = viz;
  }
  updateSidebarSelectedNode(data) {
    //reset highlighted links if any
    this.visualisation.linkCollection
      .attr("stroke", "#808080")
      .attr("stroke-width", 1.5)
      .classed("stale",false);

    var selectedNode = $(this.sidebar).find('#selected-node');
    $(".node-bar").show();
    selectedNode.addClass('node-selected');
    selectedNode.find('#full-node-id').val(data.id);
    selectedNode.find('#node-id').html(nodeShortLabel(data.id));
    selectedNode.find('#node-index').html(data.index);
    this.selectConnections(data.id);
    //selectedNode.find('.node-balance').html(data.balance);

    var classThis = this;
  
    $.ajax({
      url: BACKEND_URL + "/networks/"  + networkname + "/nodes/" + data.id,
      type: "GET",
      dataType: "json"
      }).then(
        function(d){
          console.log("Successfully retrieved node info for id: " + data.id);
          var nodeDom = selectedNode.find('#node-kademlia-table');
          //console.log(d);
          nodeDom.html(classThis.formatNodeHTML(d.protocols.bzz));
          nodeDom.removeClass("stale");
        },
        function(e){
          console.log("Error retrieving node info for id: " + data.id);
          console.log(e);
        }
    );
  }

  updateSidebarCounts(newNodes, newLinks, removeNodes, removeLinks) {
    //console.log(newNodes);
    upnodes += newNodes.length;
    $("#nodes-up-count").text(upnodes);
    $("#nodes-add-count").text(newNodes.length);

    //console.log(newLinks);

    uplinks += newLinks.length;
    $("#edges-up-count").text(uplinks);
    $("#edges-add-count").text(newLinks.length);

    //console.log(removeNodes);

    upnodes -= removeNodes.length;
    $("#nodes-up-count").text(upnodes);
    $("#nodes-remove-count").text(removeNodes.length);

    //console.log(removeLinks);

    /*
    for (var i=0; i<removeLinks.length; i++) {
      if (this.visualisation.connsById[removeLinks[i].id]) {
        uplinks -= removeLinks.length;
        delete this.visualisation.connsById[removeLinks[i].id];
      }
    }
    */
    uplinks -= removeLinks.length;
    $("#edges-up-count").text(uplinks);
    $("#edges-remove-count").text(removeLinks.length);
  }

  formatNodeHTML(str) {
    return str.replace(/\n/g,"<br/>");
  }

  selectConnections(id) {
    //set node links to "foreground" (no opacity)
    var conns         = this.visualisation.nodesById[nodeShortLabel(id)];
    this.visualisation.linkCollection.classed("stale", true);
    var connSelection = this.visualisation.linkCollection.filter(function(n) {
      return conns.indexOf(n.id) > -1;
    });
    connSelection
          .attr("stroke", "#f69047")
          .attr("stroke-width", 2.5)
          .classed("stale", false);

    //set node link targets to "foreground" (no opacity)
    this.visualisation.nodeCollection.classed("stale", true);
    var targets       = [];
    for (var k=0;k<conns.length;k++) {
      var c = this.visualisation.connsById[conns[k]];
      if (c.target == id) {
        targets.push(c.source);
      } else {
        targets.push(c.target);
        //targets.push(this.visualisation.connsById[conns[k]].target);
      }
    }
    var nodesSelection = this.visualisation.nodeCollection.filter(function(n) {
      return targets.indexOf(n.id) > -1 || n.id == id;
    });
    nodesSelection.classed("stale", false);
  }
}

function killNode() {
  var node = $('#full-node-id').val();
  $.post(BACKEND_URL + "/networks/" + networkname + "/nodes/" + node + "/stop").then(
    function(d) {
      console.log("Node successfully stopped");
    },
    function(e) {
      console.log("Error stopping node");
      console.log(e);
    })
}

function connectTo() {
  $("body").css({"cursor": "crosshair"});
  selectingTarget = true;
}

function finalizeConnectTo() {
  $("body").css({"cursor": "default"});
  selectingTarget = false;
  var target = $("#target-id").val();
  var source = $("#full-node-id").val();
  $.post(BACKEND_URL + "/networks/" + networkname + "/nodes/" + source+ "/conn/" + target).then(
    function(d) {
      console.log("Node successfully connected");
    },
    function(e) {
      console.log("Error connecting node");
      console.log(e);
    })
}

function disconnectLink(id) {
  var conn = visualisation.connsById[id];
  //$.ajax(options);
  $.ajax({
    url: BACKEND_URL + "/networks/" + networkname + "/nodes/" + conn.source+ "/conn/" + conn.target,
    type: "DELETE",
    data: {},
    contentType:'application/json',
    dataType: 'text', 
    success: function(d) {
      console.log("it worked");
    },
    error: function(d) {
      console.log("it didn't work");
    }
  });
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
    this.sidebar = new P2Pd3Sidebar('#sidebar', this);
  }

  linkDistance(d) {
    return Math.floor(Math.random() * 11) + 160;
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
    
    this.msg = this.processMsgs(triggerMsgs);

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
      this.nodeCollection = this.nodeCollection.data(this.graphNodes);
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
            if(selectingTarget) {
              $("#target-id").val(d.id);
              finalizeConnectTo();
            } else {
              //deselect
              self.nodeCollection.classed("selected", function(p) { return p.selected =  p.previouslySelected = false; })
              //select
              d3.select(this).classed("selected",true);
              self.sidebar.updateSidebarSelectedNode(d);
            }

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
          .attr("stroke-width", 1.5)
          .on("click", function(d) {
            disconnectLink(d.id);
          })
          .merge(this.linkCollection);
    }

    this.linkCollection.attr("stroke-width", function(d) { return 1.5 + ((parseInt(self.connsById[d.id].msgCount / 3) -1) / 2)  }); //increase in steps of 0.5

    if (this.msg.length) {
      var self = this;
      this.msgCollection = this.linkCollection.filter(function(n) {
        return self.msg[0].id == n.id;
      });
      this.msgCollection
        .classed("highlight",true);
      setTimeout(this.resetMsgCollection, 1000);
    }


    this.simulation.nodes(self.graphNodes);            
    this.simulation.force("link").links(self.graphLinks);
    this.simulation.force("center", d3.forceCenter(self.width/2, self.height/2));
    this.simulation.alpha(1).restart();

  }

  resetMsgCollection() {
    if (!this.msgCollection) return;
    this.msgCollection.classed("highlight",false);
  }

  appendNodes(nodes){
    if (!nodes.length) { return }

    for (var i=0; i<nodes.length; i++) {
      console.log("NEW node: " + nodes[i].id);
        this.nodesById[nodeShortLabel(nodes[i].id)] = [];
        this.graphNodes.push(nodes[i]);
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
            delete self.nodesById[nodes[k].id];
            //n.visible = false;
            break;
          } 
          //remove all nodes' connections "manually" in the frontend or we end up
          //with orphan connections 
          /*
          var lab = nodeShortLabel(nodes[k].id);
          if (self.nodesById[lab]) {
            self.hideNodesLinks(lab);
          }
          */
        }
        return contained == false ; 
        //return true; 
    });
    this.nodesChanged = true;
  }

  appendLinks(links){
    if (!links.length) { return }

    for (var i=0;i<links.length;i++) {
      var id     = links[i].id;
      var source = nodeShortLabel(links[i].source);
      var target = nodeShortLabel(links[i].target);
      //this should not happen, but it does...
      //indicates connections arrive before node events
      //so this is a bit of a hack...TODO on backend
      var srcmatch = false;
      var trgmatch = false;
      for (var k=0; k<this.graphNodes.length; k++) {
        var nid = nodeShortLabel(this.graphNodes[k].id)
        if (nid == source) {
          srcmatch = true;
        }
        if (nid == target) {
          trgmatch = true;
        }
        if (srcmatch && trgmatch) {
          break;
        }
      }
      //don't try adding connections to non-existing nodes...
      if (!srcmatch || !trgmatch) {
          //uplinks -= 1
          //$("#edges-up-count").text(uplinks);
          return
      }
      /*
      if (!this.nodesById[source]) {
        this.nodesById[source] = [];
      }
      this.nodesById[source].push(id);
      if (!this.nodesById[target]) {
        this.nodesById[target] = [];
      }
      */
      this.nodesById[target].push(id);
      this.nodesById[source].push(id);

      this.connsById[id] = {};
      this.connsById[id].target   = links[i].target;
      this.connsById[id].source   = links[i].source;
      this.connsById[id].msgCount = 0;
    }
    this.graphLinks = this.graphLinks.concat(links);
    console.log("ADD connection, source: " + source+ " - target: " + target );
    this.linksChanged = true;
  }

  hideNodesLinks(id) {
    var linksToHide = [];
    var connList = this.connsById;
    Object.keys(connList).forEach(function(key,index) {
      if (nodeShortLabel(connList[key].source) == id ||
          nodeShortLabel(connList[key].target) == id ) {
        linksToHide.push({id: key});
        eventHistory.push({timestamp:$("#time-elapsed").text(), content: {add:[], remove:[{id: key}]} });
        //uplinks -= 1;
        console.log("REMOVE connection, id:" + key);
        //delete connList[key];
      }
    });
    //$("#edges-up-count").text(uplinks);
    this.removeLinks(linksToHide);
    //delete this.nodesById[id];
  } 

  removeLinks(links){
    if (!links.length) { return }

    var self = this;
    this.graphLinks= this.graphLinks.filter(function(n){ 
        var contained = false
        for (var k=0; k<links.length; k++) {
          if (n.id == links[k].id) {
            contained = true;
            //n.visible = false;
            var s = nodeShortLabel(links[k].source);            
            var t = nodeShortLabel(links[k].target);            
            var j = self.nodesById[s].indexOf(n.id);
            if (j>-1) {
              self.nodesById[s].splice(j, 1);
            }
            j = self.nodesById[t].indexOf(n.id);
            if (j>-1) {
              self.nodesById[t].splice(j, 1);
            }
            break;
          } 
        }
        return contained == false ; 
    });
    this.linksChanged = true;
  }
  
	processMsgs(msgs){
    if (!msgs.length) { return msgs }

    for (var i=0;i<msgs.length;i++) {
      var id = msgs[i].id;
      if (this.connsById[id]) {
        this.connsById[id].msgCount += 1;
      } else {
        console.log("WARN: got message for connection which does not exist in simulation!");
      }
    }
    return msgs;
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

