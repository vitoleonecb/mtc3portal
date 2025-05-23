from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.wait import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time

driver = webdriver.Chrome()
response = driver.get('https://github.com/vitoleonecb/mtc3portal')

time.sleep(10)

logInField = WebDriverWait(driver, 20).until(EC.presence_of_element_located((By.XPATH,'/html/body/div[1]/div[1]/header/div/div[2]/div/div/div/div/div/form/input[3]')))
passwordField = WebDriverWait(driver, 20).until(EC.presence_of_element_located((By.XPATH,'/html/body/div[1]/div[1]/header/div/div[2]/div/div/div/div/div/form/div/input[1]')))
signInButton = WebDriverWait(driver, 20).until(EC.presence_of_element_located((By.XPATH,'/html/body/div[1]/div[1]/header/div/div[2]/div/div/div/div/div/form/div/input[13]')))
contactSupportText = WebDriverWait(driver, 20).until(EC.presence_of_element_located((By.XPATH,'/html/body/div[1]/div[4]/main/div[2]/div/a[1]')))

logInField.send_keys('vitoleonecb')

time.sleep(3)

passwordField.send_keys('24872487Cbb!')

time.sleep(3)

contactInner = contactSupportText.get_attribute("innerHTML")

time.sleep(3)

signInButton.click()

print(contactInner)

time.sleep(10)

primaryLinks = WebDriverWait(driver, 20).until(EC.presence_of_all_elements_located((By.CLASS_NAME,'Link--primary')))

primaryLinksList = []

for link in primaryLinks:
    primaryLinksList.append(link.get_attribute("innerHTML"))

fileNames = " ".join(primaryLinksList)

print(fileNames)

driver.quit()
print(1)