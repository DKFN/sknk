# ![](http://cdn.infra.tetel.in/sknk/sknk.png)
Sknk is a library that aims to ease the adoption of the Micro Frontend pattern in new and exiting Browser applications

Sknk is far from stable as of now and if you search a prod ready alternative you should look at Taylor


# What is the typical strcture of an SKNK app
An SKNK app is composed of 1 mother application and N child applications.
All child applications can receive properties from the mother application.
There can be many instances of a child application.
 
Here is how it looks in general:
![](http://cdn.infra.tetel.in/sknk/sknk-diagramgeneral.png)
If we look at our example, 
 
![](http://cdn.infra.tetel.in/sknk/skunkjschunks.png)

There is two sub apps in the screen:

- The red one is the Search App
- The green one is the list of movie app

And a third app, the detail view that is not running yet

And apply the schema
![](http://cdn.infra.tetel.in/sknk/sknk-diagram.png)

From now on, if you want to get hands on SKNK follow this link and start your first app in 10mns
learning the concepts along the way, or continue reading if you want to get more details

## Example use case
- Implement a full Micro Frontend workflow
- Incrementally update parts of an existing application step by step
- Offer a marketplace and allow "modding" of your Frontend

### Why was it initially made ?
SKNK is a part of another non released editor for the Amethyst game engine,
the goal is to provide a non constrained way to extend the Editor UI for either its custom
GameComponents or Editor's/Amethyst's.

With the help of WebBundlers like WebPack or Parcel and using a static server like `serve` if found
it very easy and convenient to use and implement.

This is why I choosed to document and explain my simple implementation outside of this project.
I hope that you find my journey helpful or entertaining.
 

## Problems it solves
- Lazy-HotLoading of JS applications
- Controlling child applications life cycle
- Contract between mother and child applications
- Agnosticity in mother and child applications framework and design choices
- Specifying where applications are allowed to spawn and wich
- Top down dataflow between applications
- Passing functions between mother and child applications
- Ease of developping a child application without the need of launch of the mother app

## Problems it aims to solve
- Standard implementation of layouts via WebComponents API
- WASM support
- HotLoading of child application CSS and HTML

## Problems now out of scope (but considered)
- Isolation of CSS with shadow dom
- Messaging between applications 
- SSR outside of mother application

# Current limitations
(*noted limitations have documented workarounds)

(**noted limitations are planned to be solved)
- Only one instance of SKNK server per app (by design)
- Child applications must be JS only (*\*)(\*)
- Application layouts require the use of divs and may break your design (**)

# SKNK in details
## Your first app
- Here is a minimal setup to implement a meteo website with a SKNK widget to show current time
- How to recreate the demo (React mother App, VanillaJS, React and VueJS childs)

## Usefull tutorials
- SKNK server in depth
- Bundling a ReactJS child app
- Bundling a VueJS child app
- Bundling a VanillaJS child app
- RenderLoop: Tuning performance by idling/stopping/change frequency

## Understanding apps lifecycle

The implementation of SKNK of the Micro Frontend pattern is by looking at comminications between the Mother application and the
child app as a Client - Server type of comunication

Here is how a single mother app and a single child app will interact with eachorther
