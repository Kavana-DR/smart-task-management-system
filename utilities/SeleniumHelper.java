package utilities;

import java.time.Duration;

import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.Select;
import org.openqa.selenium.support.ui.WebDriverWait;

/*
 * SeleniumHelper contains reusable methods for common UI actions.
 * This keeps test cases short, readable, and beginner-friendly.
 */
public class SeleniumHelper {
    private final WebDriver driver;
    private final WebDriverWait wait;

    public SeleniumHelper(WebDriver driver) {
        this.driver = driver;
        this.wait = new WebDriverWait(driver, Duration.ofSeconds(12));
    }

    public WebElement waitForVisible(By locator) {
        return wait.until(ExpectedConditions.visibilityOfElementLocated(locator));
    }

    public WebElement waitForClickable(By locator) {
        return wait.until(ExpectedConditions.elementToBeClickable(locator));
    }

    public void waitForInvisible(By locator) {
        wait.until(ExpectedConditions.invisibilityOfElementLocated(locator));
    }

    public void waitForTextInLocalStorage(String key, String text) {
        wait.until(driver -> {
            Object value = ((JavascriptExecutor) driver)
                    .executeScript("return localStorage.getItem(arguments[0]);", key);
            return value != null && value.toString().contains(text);
        });
    }

    public void click(By locator) {
        try {
            WebElement element = waitForClickable(locator);
            scrollIntoView(element);
            element.click();
        } catch (Exception exception) {
            System.out.println("[WARN] Normal click failed. Trying JavaScript click: " + exception.getMessage());
            WebElement element = waitForVisible(locator);
            javascriptClick(element);
        }
    }

    public void type(By locator, String value) {
        WebElement element = waitForVisible(locator);
        scrollIntoView(element);
        element.clear();
        element.sendKeys(value);
    }

    public void setInputValue(By locator, String value) {
        WebElement element = waitForVisible(locator);
        scrollIntoView(element);
        ((JavascriptExecutor) driver).executeScript(
                "arguments[0].value = arguments[1];"
                        + "arguments[0].dispatchEvent(new Event('input', { bubbles: true }));"
                        + "arguments[0].dispatchEvent(new Event('change', { bubbles: true }));",
                element, value);
    }

    public String text(By locator) {
        return waitForVisible(locator).getText();
    }

    public boolean isVisible(By locator) {
        try {
            return waitForVisible(locator).isDisplayed();
        } catch (Exception exception) {
            return false;
        }
    }

    public void waitForUrlContains(String text) {
        wait.until(ExpectedConditions.urlContains(text));
    }

    public void scrollIntoView(WebElement element) {
        ((JavascriptExecutor) driver).executeScript("arguments[0].scrollIntoView({block:'center'});", element);
    }

    public void javascriptClick(WebElement element) {
        ((JavascriptExecutor) driver).executeScript("arguments[0].click();", element);
    }

    public void setLocalStorageItem(String key, String value) {
        ((JavascriptExecutor) driver).executeScript("localStorage.setItem(arguments[0], arguments[1]);", key, value);
    }

    public void selectByVisibleText(By locator, String visibleText) {
        WebElement element = waitForVisible(locator);
        scrollIntoView(element);
        Select select = new Select(element);
        select.selectByVisibleText(visibleText);
    }
}
