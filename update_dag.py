from airflow import DAG
from airflow.operators.bash_operator import BashOperator
from airflow.operators.python_operator import PythonOperator
from generate_blogs import update_webpage
from datetime import datetime

dag = DAG('update_portfolio',
          description='Updates Website portion of portfolio with most recent posts',
          schedule_interval='0 12 * * *',
          start_date=datetime(2020, 5, 16), catchup=False)

update_html = PythonOperator(update_webpage, dag=dag)
commit_dag = BashOperator(
    'cd /root/airflow/dags/portfolio && git add . && git commit -m "update based on new statsworks entry" && git push', dag=dag)

update_html >> commit_dag
