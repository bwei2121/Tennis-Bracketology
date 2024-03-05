import json
from rest_framework.views import APIView
from django.http import HttpResponse, Http404
from django.shortcuts import render
from tennis_scraper import getAllTournaments, getBracketInfo
from tennis_bracket.serializers import BracketSerializer

# Create your views here.
class BracketInformation(APIView):
  # Send all matches results of bracket to frontend
  def get(self, request):
    tournament=request.GET['tournament']
    bracketData=getBracketInfo(f"https://www.tennisabstract.com/current/{tournament}.html")
    if(bracketData==None):
      raise Http404
    title=bracketData[0]
    roster=bracketData[1]
    results=bracketData[2]
    data={"title": title, "roster": roster, "results": results}
    return HttpResponse(json.dumps(data))
  
  # Save information from user created bracket
  def post(self, request):
    serializer=BracketSerializer(data=request.data)
    if serializer.is_valid(raise_exception=True):
      serializer.save()
    return HttpResponse()
  
class TournamentsData(APIView):
  # Send all tournaments that can be viewed by user from tennisabstract.com
  def get(self, request):
    allTournaments=getAllTournaments()
    data={"tournaments": allTournaments}
    return HttpResponse(json.dumps(data))