import requests
from bs4 import BeautifulSoup
from dataclasses import dataclass

# Gets the html on the URL page
# Returns page content on URL given by BeautifulSoup library
def getPage():
  URL = "https://www.tennisabstract.com/current/2023ATPCincinnati.html" # random url, eventually will let user choose a specific tournament
  headers = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.95 Safari/537.36'}
  page = requests.get(URL, headers=headers)
  pageContent = BeautifulSoup(page.content, "html.parser")
  return pageContent

# Find the specific HTML in the page content that lists the players in the tournament
# Parameter playerContent: the HTML page content
# Returns HTML that contains the players in the tournament
def findPlayerList(playerContent):
  roundTypes=['var proj128', 'var proj64', 'var proj32', 'var proj16', 'var proj8', 'var proj4', 'var proj2', 'var projCurrent']
  beginIndex=0
  endIndex=0
  beginRound=0
  for round in roundTypes:
    beginIndex=playerContent.find(round)
    if(beginIndex!=-1):
      break
    beginRound+=1
  for round in roundTypes[beginRound+1:]:
    endIndex=playerContent.find(round)
    if(endIndex!=-1 and endIndex!=beginIndex):
      break
  playersHTML=playerContent[beginIndex+9:endIndex-7]
  return playersHTML

# Creates a player list based on HTML content of players in tournament
# Parameter playersSoup: HTML player content created by BeautifulSoup library
# Returns list of players and ids for players
def getPlayerList(playersSoup):
  players=playersSoup.table.find_all('td')
  playerList=[]
  playerId=0
  for playerHTML in players:
    if(playerHTML.a): 
      player=''
      if(playerHTML.contents[0]!=playerHTML.a):
        player+=playerHTML.contents[0]
        player+=' '
      player+=playerHTML.find('a').contents[0]
      playerList.append({"id": playerId, "name": str(player)})
      playerId+=1
    elif(playerHTML.text=="Bye"):
      playerList.append(None)
  return playerList

# Gets the tournament name from the tournamnt URL page
# Parameter soup: HTML of tournament URL page 
# Returns tournament title
def getTournamentTitle(htmlPage):
  content=htmlPage.head.title.text
  beginIndex=content.find(":")
  endIndex=content.find("Results")
  title=content[beginIndex+2:endIndex-1]
  return title

# Get players in the tournament from tournament HTML page 
# Returns list of players and ids for players
def getBracketInfo():
  content=getPage()
  tournamentTitle=getTournamentTitle(content)
  playersContent=str(content.head.find_all('script')[1].contents[0])
  playersHTML=findPlayerList(playersContent)
  playersSoup = BeautifulSoup(playersHTML, "html.parser")
  playerList=getPlayerList(playersSoup)
  return (tournamentTitle, playerList)