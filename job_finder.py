"""
Job Finder based on Resume
This script extracts keywords from a resume and searches for matching jobs using web search.
"""

import requests
from bs4 import BeautifulSoup
import re
from collections import Counter
import json

def extract_keywords_from_resume(resume_text):
    """
    Extract key skills and keywords from resume text.
    """
    # Simple keyword extraction - in a real app, use NLP like spaCy
    skills = [
        'python', 'java', 'javascript', 'c++', 'sql', 'machine learning', 'data analysis',
        'web development', 'react', 'node.js', 'aws', 'docker', 'kubernetes', 'git',
        'agile', 'scrum', 'project management', 'communication', 'teamwork'
    ]

    found_skills = []
    resume_lower = resume_text.lower()
    for skill in skills:
        if skill in resume_lower:
            found_skills.append(skill)

    # Extract common words (excluding stop words)
    stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'shall', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'its', 'our', 'their', 'this', 'that', 'these', 'those'}
    words = re.findall(r'\b\w+\b', resume_lower)
    filtered_words = [word for word in words if len(word) > 2 and word not in stop_words]
    common_words = [word for word, count in Counter(filtered_words).most_common(10)]

    return found_skills + common_words

def search_jobs(keywords, location='remote', num_results=10):
    """
    Search for jobs using a simple web scrape of Indeed (for demo).
    Note: Web scraping may violate terms of service. Use APIs in production.
    """
    query = ' '.join(keywords) + f' jobs in {location}'
    url = f'https://www.indeed.com/jobs?q={query.replace(" ", "+")}&l={location}'

    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }

    try:
        response = requests.get(url, headers=headers)
        soup = BeautifulSoup(response.text, 'html.parser')

        jobs = []
        job_cards = soup.find_all('div', class_='job_seen_beacon')

        for card in job_cards[:num_results]:
            title_elem = card.find('h2', class_='jobTitle')
            company_elem = card.find('span', class_='companyName')
            location_elem = card.find('div', class_='companyLocation')
            link_elem = card.find('a', class_='jcs-JobTitle')

            title = title_elem.text.strip() if title_elem else 'N/A'
            company = company_elem.text.strip() if company_elem else 'N/A'
            location = location_elem.text.strip() if location_elem else 'N/A'
            link = 'https://www.indeed.com' + link_elem['href'] if link_elem else 'N/A'

            jobs.append({
                'title': title,
                'company': company,
                'location': location,
                'link': link
            })

        return jobs

    except Exception as e:
        print(f"Error searching jobs: {e}")
        return []

def main():
    # Example resume text - replace with actual resume parsing
    resume_text = """
    John Doe
    Software Engineer with 5 years of experience in Python, JavaScript, and web development.
    Skills: Python, Machine Learning, Data Analysis, React, Node.js, AWS, Docker.
    Experience: Developed web applications using React and Node.js. Worked on ML projects with Python.
    """

    keywords = extract_keywords_from_resume(resume_text)
    print("Extracted keywords:", keywords)

    jobs = search_jobs(keywords, location='remote', num_results=5)
    print("\nFound jobs:")
    for job in jobs:
        print(f"- {job['title']} at {job['company']} ({job['location']})")
        print(f"  Link: {job['link']}\n")

if __name__ == "__main__":
    main()