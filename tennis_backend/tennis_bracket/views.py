import json
from rest_framework.views import APIView
from django.http import HttpResponse
from django.shortcuts import render
from tennis_scraper import getBracketInfo

# Create your views here.
class BracketInformation(APIView):
  # Send initial matches of bracket to frontend
  def get(self, request):
    bracketData=getBracketInfo()
    title=bracketData[0]
    roster=bracketData[1]
    data={"title": title, "roster": roster}
    return HttpResponse(json.dumps(data))