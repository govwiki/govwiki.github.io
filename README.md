# Govwiki.us -  site project
## http://govwiki.us/


A project for  govwiki.us future site. Html pages, scripts, css etc.
Everything placed inside the project  is instantly accessible at http://govwiki.github.io/govwiki.us/. 

Project: https://github.com/govwiki/govwiki.us

Site: http://govwiki.github.io/govwiki.us/

and

http://govwiki.us/

To change this text, please edit README.md   <br>
https://github.com/govwiki/govwiki.us/edit/gh-pages/README.md

## For developers

Mac or Linux

Install git, nodejs, coffeescript

### Environment

Open console.



**Setup**

Clone the project

`git clone https://github.com/govwiki/govwiki.us.git`

Change directory to govwiki.us/

`cd govwiki.us`

install dependencies

`npm install`



**Development**

Run the development environment

`npm run dev`

Open a browser http://localhost:8080

You should see the first page of the site. 
In the center of the upper border of page there should be a tiny red word 'live'. 
That means that live preview is working.

Virtually all development will take place in the coffee, jade and css folders.  Generally, you
should only edit coffee, jade and stylus files.  The main stylus file, index.styl, is in the css folder.

Every time you save jade, coffee or stylus files they are automatically compiled 
to HTML, javascript and CSS files, the project is rebuilt and live-preview reloads 
the page in the browser window. So you should see changes in your files on the page immediately.

To keep things simple, the project does not use any framework (such as AngularJS, Backbone etc).
We can begin to use frameworks, later when the technology stack is settled.

Other impotrtant files (to view but NOT change) are:
   (1) files in the data folder which control the content of pulldowns on the home page.  These may need to be refreshed from the database periodically.
   (2) package.json in the main folder which specifies certain project parameters

**Saving changes to github**

`npm run push`


**IMPORTANT NOTE**

During some times, we will have multiple developers at different sites pushing updates.
Before you edit files and before pushing your changes, please make sure you 
have the most recent version of the code, which could be changed by other developers.

To do so run:

`git pull`

Please make small, incremental changes and push frequently - as long as you have tested your changes.

Please do not update third party libraries such as bower.  Updates are known to break existing functionality.
