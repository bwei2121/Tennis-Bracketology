import json
import requests
from bs4 import BeautifulSoup
from dataclasses import dataclass
import datetime

# Gets the html on the URL page chosen by user
# Returns page content on URL given by BeautifulSoup library
def getPage(url):
  headers = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.95 Safari/537.36'}
  page = requests.get(url, headers=headers)
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
  dataTable=playersSoup.table
  if(dataTable==None):
    return None
  players=dataTable.find_all('td')
  playerList=[]
  playerId=0
  qualifierPlayerNumber=1
  for playerHTML in players:
    if(playerHTML.a): 
      player=''
      if(playerHTML.contents[0]!=playerHTML.a):
        player+=playerHTML.contents[0]
        player+=' '
      player+=playerHTML.find('a').contents[0]
      playerList.append({"playerId": playerId, "playerName": str(player)})
      playerId+=1
    elif(playerHTML.text=="Bye"):
      playerList.append(None)
    elif("Qualifier" in playerHTML.text):
      playerList.append({"playerId": playerId, "playerName": f"Qualifer Player {qualifierPlayerNumber}"})
      playerId+=1
      qualifierPlayerNumber+=1
  return playerList

# Gets the tournament name from the tournamnt URL page
# Parameter soup: HTML of tournament URL page 
# Returns tournament title
def getTournamentTitle(htmlPage):
  content=htmlPage.head.title.text
  return getContentUsingStartAndEndString(content, ":", "Results", 2, 1)

# Check if html has score information about match
# Parameter scoreHTML: html related to match score
# Returns boolean depending on if html is related to match score
def hasScore(scoreHTML):
  scoreDigits=0
  for digit in scoreHTML:
    if(digit.isdigit()):
      scoreDigits+=1
  return ("W/O" in scoreHTML or scoreDigits>=2)

# Get score infomration of the match from the html related to the score
# Parameter scoreHTML: html related to match score
# Returns scores for both players together as a string 
def filterScore(scoreHTML):
  scoreList=[]
  numberFound=False
  if("W/O" in scoreHTML): # one player has withdrawn
    scoreList.append("W")
    scoreList.append("")
  else:
    for digit in scoreHTML:
      if(not numberFound and digit.isdigit()):
        numberFound=True
      if(digit.isdigit() or (numberFound and digit in "()")):
        scoreList.append(digit)
  return "".join(scoreList) 

# Gets individual player score using the combined score of both players from filterScore function
# Parameter score: combined score of both players from filterScore function
# Parameter player: player of interest
# Returns individual player score 
def playerScore(score, player): 
  playerScore=""
  if(player==1):
    i=0
  else:
    i=1
  while(i<len(score)):
      if(score[i-1]=="(" or score[i]=="("):
        index=i
        while(score[index]!=")"):
          index+=1
        if(player==1):
          i=index+1
        else:
          i=index+2
      else:
        playerScore+=score[i]
        i+=2
  return playerScore

# Get id of player using the player list created by getPlayerList function
# Parameter player: name of player in interest
# Parameter playerList: list of players and their corresponding ids
# Returns id of player in interest or -1 if player not found in playerList
def searchIDForPlayer(player, playerList): 
  for item in playerList:
    if(item!=None):
      checkForSeedIndex=item['playerName'].find(') ')
      playerName=item['playerName']
      # remove seed off player name
      if(checkForSeedIndex!=-1):
        playerName=item['playerName'][checkForSeedIndex+2:]
      if(playerName==player):
        return item['playerId']
  return -1

# Check if the round name string can be found in the content HTML
# Paramter content: HTML that represents the matches in the tennis bracket
# Parameter index: integer that represents index in content HTML that is being checked for round name
# Returns boolean representing if a round name is found in content HMTL
def checkForRoundName(content, index):
  roundNames=["R1", "R2", "R3", "R4", "QF", "SF", "F"]
  for round in roundNames:
    if(round in content[index]):
      return True
  return False

# Find important match result information in the HTML that represents the tennis matches
# Parameter content: html related to match result information
# Parameter index: index to start search of match related information in HTML
# Return tuple of both players, html related to match score, and new index to search for next match in content HTML
def findMatchResultInfo(content, index):
  newIndex=index+1
  player1=content[newIndex]
  while(player1.name!='a' or player1.text=='d.'):
    newIndex+=1
    player1=content[newIndex]
  newIndex+=1
  possibleBye=content[newIndex]
  if("bye" in possibleBye.text): # player has a bye
    return (newIndex, None)
  newIndex+=1
  player2=content[newIndex]
  while(player2.name!='a' or player2.text=='d.'):
    newIndex+=1
    player2=content[newIndex]
  newIndex+=1
  scoreHTML=content[newIndex]
  while(not hasScore(scoreHTML)):
    newIndex+=1
    scoreHTML=content[newIndex]
  return (newIndex, (player1, player2, scoreHTML))

# Get match result information to add to match list for the tennis bracket
# Paramater player1: player 1 in the match
# Paramater player2: player 2 in the match
# Paramater scoreHTML: html related to match score
# Parameter matchList: list of match results for tennis bracket
# Paramter playerList: list of players and corresponding ids
# Returns matchList with new match result
def getMatchResultInfo(player1, player2, scoreHTML, matchList, playerList):
  playerId1=searchIDForPlayer(player1.text, playerList)
  playerId2=searchIDForPlayer(player2.text, playerList)
  filteredScore=filterScore(scoreHTML)
  scoreWinner=playerScore(filteredScore, 1)
  scoreLoser=playerScore(filteredScore, 2)
  if(playerId1<playerId2):
    opp1={"score": scoreWinner, "result": 'win'}
    opp2={"score": scoreLoser}
    matchList.append({"id1": playerId1, "id2": playerId2, "opponent1": opp1, "opponent2": opp2})
  else:
    opp1={"score": scoreLoser}
    opp2={"score": scoreWinner, "result": 'win'}
    matchList.append({"id1": playerId1, "id2": playerId2, "opponent1": opp1, "opponent2": opp2})
  return matchList

# Gets list of match results for the tennis bracket from the related HTML
# Paramter content: html related to tennis bracket
# Parameter playerList: list of players and corresponding ids
# Returns list of match results for tennis bracket
def getCompletedMatchList(content, playerList):
  matchList=[]
  index=0
  while(index<len(content)):
    if(checkForRoundName(content, index)):
      (newIndex, matchResult)=findMatchResultInfo(content, index)
      if(matchResult!=None):
        (player1, player2, scoreHTML)=matchResult
        matchList=getMatchResultInfo(player1, player2, scoreHTML, matchList, playerList)
      index+=(newIndex-index)
    elif("Q1" in content[index] or "Q2" in content[index]): # rounds not needed for bracket
      break
    else:
      index+=1
  return matchList

# Gets the match results in the tournament bracket
# Parameter playerList: list of playerse in the tournament
# Parameter content: HTML of tournament URL page 
# Returns tournament title
def getCompletedMatchResults(playerList, content):
  resultsHTML=getContentUsingStartAndEndString(content, 'completedSingles', 'completedDoubles', 19, 7)
  soup=BeautifulSoup(resultsHTML, "html.parser")
  matchContent=soup.contents
  matchList=getCompletedMatchList(matchContent, playerList)
  return matchList

# Get players in the tournament from tournament HTML page chosen by user
# Returns list of players and ids for players
def getBracketInfo(url):
  content=getPage(url)
  tournamentTitle=getTournamentTitle(content)
  playersContent=str(content.head.find_all('script')[-1].contents[0]) # last script tag in head has relevant bracket data needed
  playersHTML=findPlayerList(playersContent)
  playersSoup = BeautifulSoup(playersHTML, "html.parser")
  playerList=getPlayerList(playersSoup)
  if(playerList==None):
    return None
  matchList=getCompletedMatchResults(playerList, playersContent)
  return (tournamentTitle, playerList, matchList)

# Get all tournament brackets that are available to view from tennisabstract.com, recent tournaments are stored at beginning of array
# Returns array of tournament names and their urls
def getAllTournaments():
  URL = "https://www.tennisabstract.com/current/"
  headers = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.95 Safari/537.36'}
  page = requests.get(URL, headers=headers)
  content = BeautifulSoup(page.content, "html.parser")
  recentTournaments=[]
  currentTournaments=[]
  for row in content.body.find('table').find_all('tr'):
    rowData=row.find_all('td')
    if(len(rowData)>=3):
      urlData=rowData[1]
      if(urlData.a):
        url=urlData.contents[0].get('href')
        if(not (url.startswith('2022') or url=='favicon.ico' or url=='/')):
          title=parsedTitle(url.replace('.html', ''))
          updateTime=rowData[2].contents[0]
          index=updateTime.find(' ')
          updateTime=updateTime[0:index]
          updateTimeArray=updateTime.split('-')
          if(len(updateTimeArray)==3):
            year=int(updateTimeArray[0])
            month=int(updateTimeArray[1])
            day=int(updateTimeArray[2])
            tournamentDate=datetime.datetime(year, month, day)
            currentDate=datetime.datetime.now()
            if(currentDate-tournamentDate<=datetime.timedelta(days=7)): # finding recent tournaments
              recentTournaments.append({'title': title, 'url': url, 'recent': True})
            else:
              currentTournaments.append({'title': title, 'url': url, 'recent': False})
  tournaments=recentTournaments+currentTournaments
  return tournaments

# Converts title into a readable title for user
# Parameter title: tournament name but less readable for user
# Returns title that is readable by user
def parsedTitle(title):
  keywords=['2023', '2024', 'ATP', 'WTA', 'US']
  parseIndexes=[]
  for key in keywords:
    index=title.find(key)
    if(index!=-1):
      parseIndexes.append(index+len(key))
  startIndex=parseIndexes[-1]+1 # each title has at least one keyword so there will be at least one index in parseIndexes
  for i in range(startIndex, len(title)):
    if((title[i].isupper() or title[i].isnumeric()) and (i-1>=0 and title[i-1].isalpha()) or (i-1>=0 and title[i-1].isnumeric() and title[i].isalpha())):
      parseIndexes.append(i)
  words=[]
  for i in range(len(parseIndexes)):
    startIndex=0
    endIndex=parseIndexes[i]
    if(i!=0):
      startIndex=parseIndexes[i-1]
    words.append(title[startIndex:endIndex])
  words.append(title[parseIndexes[len(parseIndexes)-1]:len(title)])
  return ' '.join(words)

# Gets head to head record between two players in a match
# Parameter player: name of player 1 in match (parsed for url search)
# Parameter opponent: name of player 2 in match
# Parmeter opponentParsed: name of player 2 but parsed for url search
# Returns head to head record from perspective of player 1 and if the match is ATP (men's) or WTA (women's)
def getH2H(player, opponent, opponentParsed):
  wins=0
  losses=0
  # Get h2h record if match between men players
  url=f"https://www.tennisabstract.com/cgi-bin/player.cgi?p={player}&f=ACareerqq&q={opponentParsed}"
  matchArrayString=findRelevantData(url, "var matchmx", "var fourspaces", 14, 4)
  tour="ATP" # men's tennis
  if(matchArrayString):
    matchArray=json.loads(matchArrayString)
  else:
    # Get h2h record if match between women players
    url1=f"https://www.minorleaguesplits.com/tennisabstract/cgi-bin/jsmatches/{player}.js"
    url2=f"https://www.minorleaguesplits.com/tennisabstract/cgi-bin/jsmatches/{player}Career.js"
    matchArray=findWomenMatches(url1, url2)
    tour="WTA" # women's tour
  for match in matchArray:
    if(match[11]==opponent): # match[11] stores opponent in match
      if(match[9]!="W/O" and match[9]!=""): # withdraws and matches that hasn't happened do not count towards H2H
        if(match[4]=="W"): # match[4] stores result of match (either "W" or "L")
          wins+=1
        else: # match[4]=="L"
          losses+=1
  return ({"wins": wins, "losses": losses}, tour)

# Get current rank of player
# Paremeter player: name of player (parsed for url search)
# Returns current rank of player
def getPlayerRank(player):
  # Get current rank if player from ATP (men's)
  url=f"https://www.tennisabstract.com/cgi-bin/player.cgi?p={player}"
  playerRankData=findRelevantData(url, "var currentrank", "var peakrank", 18, 2)
  if(playerRankData==''):
     # Get current rank if player from WTA (women's)
    url=f"https://www.tennisabstract.com/cgi-bin/wplayer-classic.cgi?p={player}"
    playerRankData=findRelevantData(url, "var currentrank", "var peakrank", 18, 2)
  if(playerRankData=='"UNR"'): # unranked
    playerRankData=-1
  return int(playerRankData)

# Get a specific part of parameter content given a starting and ending string
# Parameter content: string that will be divided based on specificed starting and ending strings
# Parameter startParseString: string that designates start of desired string in parameter content
# Parameter endParseString: string that designates end of desired string in parameter content
# Parmeter addToStartIndex: number that is used to fine-tune desired string, usually to remove parameter startParseString from parameter content
# Parmeter subtractToEndIndex: number that is used to fine-tune desired string, usually to remove parameter endParseString from parameter content
# Returns string that is desired, a subset of parameter content
def getContentUsingStartAndEndString(content, startParseString, endParseString, addToStartIndex, subtractToEndIndex):
  startIndex=content.find(startParseString)
  endIndex=content.find(endParseString)
  return content[startIndex+addToStartIndex:endIndex-subtractToEndIndex]

# Finds relevent match/bracket data 
# Parameter url: url that contains the desired match/bracket data
# Parameter startParseString: string that designates start of desired string in page content
# Parameter endParseString: string that designates end of desired string in page content
# Parmeter addToStartIndex: number that is used to fine-tune desired string, usually to remove parameter startParseString from page content
# Parmeter subtractToEndIndex: number that is used to fine-tune desired string, usually to remove parameter endParseString from page content
def findRelevantData(url, startParseString, endParseString, addToStartIndex, subtractToEndIndex):
  pageContent=getPage(url)
  if(pageContent.head==None):
    return ''
  dataContent=str(pageContent.head.find_all('script')[-1].contents[0]) # last script tag in head has relevant data needed
  return getContentUsingStartAndEndString(dataContent, startParseString, endParseString, addToStartIndex, subtractToEndIndex)

# Finds all WTA matches for a WTA player, eventually used for finding h2h record in function getH2H
# Parameter url1: url that contains recent matches of player
# Parameter url2: url that contains older matches of player
# Returns array of all matches for WTA player
def findWomenMatches(url1, url2):
  pageContent1=getPage(url1)
  pageContent2=getPage(url2)
  recentMatches=getContentUsingStartAndEndString(str(pageContent1), "var matchmx", "]];", 14, 1)
  olderMatches=getContentUsingStartAndEndString(str(pageContent2), "var morematchmx", ";", 18, 0)
  recentMatchesArray=json.loads(recentMatches)
  olderMatchesArray=json.loads(olderMatches)
  allMatches=olderMatchesArray+recentMatchesArray
  return allMatches