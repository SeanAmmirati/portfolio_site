from airflow import DAG
from airflow.operators.bash_operator import BashOperator
from airflow.operators.python_operator import PythonOperator
from datetime import datetime
from airflow.operators.subdag_operator import SubDagOperator
from airflow.executors.sequential_executor import SequentialExecutor

import bs4
import requests


def grab_sw():

    page = requests.get('http://www.statsworks.info')
    return page.content


def get_top_n_articles(n=6, img_only=True):
    pg = grab_sw()
    soup = bs4.BeautifulSoup(pg, 'html.parser')
    articles = soup.find_all('article')

    filled = 0
    article_list = []
    while (filled < n) and (articles):
        article = articles.pop(0)
        article_link = article.find('a')['href']
        article_title = article.find('a').text.strip().replace('   ', ': ')
        article_desc = article.find('p').find('p').text
        article_time = article.find('time').text

        try:
            article_img = article.find('img')['src']
        except TypeError:
            if img_only:
                continue
            else:
                article_img = None

        article_list.append(
            [article_link,  article_img, article_title, article_desc, article_time])
        filled += 1
    return article_list


def html_string(link, img, title, desc, time):
    return '''<div class="col-12 col-sm-8 col-lg-4">
                  <div class="card single-post"><a class="post-img" href="{link}"><img class="card-img-top" src="{img}" alt="StatsWorks post" style="background-color:white;"><span class="content-date">{time}</span></a>
                    <div class="card-body post-content"><a href="{link}">
                        <h5 class="card-title content-title">{title}</h5>
                      </a>
                      <p class="card-text content-description">{desc}</p>
                    </div>
                  </div>
                </div>'''.format(**dict(link=link, img=img, title=title,
                                        desc=desc, time=time))


def create_full_html_string(n=6):
    meta = get_top_n_articles(n=n)
    html_str = ""
    for l in meta:
        for line in html_string(*l).split('\n'):
            html_str += line
    sp = bs4.BeautifulSoup(html_str, 'html.parser')

    return sp.prettify()


def create_video_html():
    html = create_full_html_string()

    with open('/home/pi/airflow/dags/portfolio/portfolio_site/template.html', 'r') as f:
        template = f.read()

    final_html = template.format(**dict(statsworks_posts=html))

    bracket_str = "videoURL:'https://www.youtube.com/watch?v=kkpWfGzoems&lc=Ugz_P8_x6nUCKWMZTmh4AaABAg',containment:'#home',autoPlay:true, mute:true, showControls:false, stopMovieOnBlur:false, showYTLogo: false"
    final_html = final_html.replace(bracket_str, "{" + bracket_str + "}")

    return final_html


def clean_prettified(html):
    html = html.replace("I’m a\n       ", "I'm a")
    html = html.replace("&amp;nbsp", "&nbsp")
    return html


def update_webpage():

    html = create_video_html()
    html = bs4.BeautifulSoup(html, 'html.parser').prettify()

    html = clean_prettified(html)
    with open('/home/pi/airflow/dags/portfolio/index.html', 'w') as f:
        f.write(html)


main_dag = DAG('full_update_portfolio',
               description='Full DAG to update Website portion of portfolio website',
               schedule_interval=None,
               start_date=datetime(2020, 5, 16), catchup=False)
# made into subdag to ensure done on the same system
subdag = DAG('full_update_portfolio.update_seq',
             description='Updates Website portion of portfolio with most recent posts',
             schedule_interval=main_dag.schedule_interval,
             start_date=main_dag.start_date, catchup=False)

pull_any_changes = BashOperator(
    task_id='pull', bash_command='cd /home/pi/airflow/dags && git submodule update --recursive --remote --merge',
    dag=subdag
)
update_html = PythonOperator(
    task_id='update_html', python_callable=lambda: update_webpage(), dag=subdag)
commit_dag = BashOperator(
    task_id='push_changes',
    bash_command='cd /home/pi/airflow/dags/portfolio/portfolio_site &&git add . && git diff-index --quiet HEAD || git commit -m "update based on new statsworks entry" && git push', dag=subdag)

pull_any_changes >> update_html >> commit_dag

task = SubDagOperator(
    task_id='update_seq',
    subdag=subdag,
    executor=SequentialExecutor(),
    dag=main_dag
)
